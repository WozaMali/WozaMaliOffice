import { supabase } from './supabase';

export interface CollectionMaterial {
  material_id: string;
  kilograms: number;
  contamination_pct: number;
  notes?: string;
}

export interface LiveCollectionData {
  customer_id: string;
  address_id?: string;
  materials: CollectionMaterial[];
  notes?: string;
  scale_photo?: string;
  recyclables_photo?: string;
  lat?: number;
  lng?: number;
}

export interface CollectionResult {
  pickup_id: string;
  total_kg: number;
  total_value: number;
  environmental_impact: {
    co2_saved: number;
    water_saved: number;
    landfill_saved: number;
    trees_equivalent: number;
  };
  points_earned: number;
  fund_allocation: {
    green_scholar_fund: number;
    user_wallet: number;
  };
}

/**
 * Submit a live collection to the database
 * This creates a pickup record, pickup items, and updates customer metrics
 */
export async function submitLiveCollection(
  collectionData: LiveCollectionData,
  collector_id: string
): Promise<CollectionResult> {
  try {
    console.log('🚀 Starting live collection submission...', collectionData);

    // Step 1: Create the pickup record
    const { data: pickup, error: pickupError } = await supabase
      .from('pickups')
      .insert({
        customer_id: collectionData.customer_id,
        collector_id: collector_id,
        address_id: collectionData.address_id,
        status: 'submitted',
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        lat: collectionData.lat,
        lng: collectionData.lng,
        total_kg: 0, // Will be calculated by trigger
        total_value: 0 // Will be calculated by trigger
      })
      .select()
      .single();

    if (pickupError) {
      console.error('❌ Error creating pickup:', pickupError);
      throw new Error(`Failed to create pickup: ${pickupError.message}`);
    }

    console.log('✅ Pickup created:', pickup.id);

    // Step 2: Create pickup items for each material
    const pickupItems = [];
    for (const material of collectionData.materials) {
      const { data: item, error: itemError } = await supabase
        .from('pickup_items')
        .insert({
          pickup_id: pickup.id,
          material_id: material.material_id,
          kilograms: material.kilograms,
          contamination_pct: material.contamination_pct,
          notes: material.notes
        })
        .select()
        .single();

      if (itemError) {
        console.error('❌ Error creating pickup item:', itemError);
        throw new Error(`Failed to create pickup item: ${itemError.message}`);
      }

      pickupItems.push(item);
      console.log(`✅ Pickup item created for ${material.kilograms}kg of material`);
    }

    // Step 3: Add photos if provided
    if (collectionData.scale_photo || collectionData.recyclables_photo) {
      const photos = [];
      
      if (collectionData.scale_photo) {
        photos.push({
          pickup_id: pickup.id,
          photo_url: collectionData.scale_photo,
          photo_type: 'scale',
          description: 'Scale photo from live collection'
        });
      }
      
      if (collectionData.recyclables_photo) {
        photos.push({
          pickup_id: pickup.id,
          photo_url: collectionData.recyclables_photo,
          photo_type: 'recyclables',
          description: 'Recyclables photo from live collection'
        });
      }

      if (photos.length > 0) {
        const { error: photoError } = await supabase
          .from('pickup_photos')
          .insert(photos);

        if (photoError) {
          console.error('⚠️ Warning: Failed to save photos:', photoError);
          // Don't fail the entire collection for photo errors
        } else {
          console.log(`✅ ${photos.length} photos saved`);
        }
      }
    }

    // Step 4: Get the updated pickup with calculated totals
    const { data: updatedPickup, error: fetchError } = await supabase
      .from('pickups')
      .select('*')
      .eq('id', pickup.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching updated pickup:', fetchError);
      throw new Error(`Failed to fetch updated pickup: ${fetchError.message}`);
    }

    // Step 5: Calculate environmental impact and points
    const environmentalImpact = await calculateCollectionImpact(collectionData.materials);
    const pointsEarned = await calculateCollectionPoints(collectionData.materials);
    const fundAllocation = await calculateFundAllocation(collectionData.materials, updatedPickup.total_value);

    // Step 6: Update wallet ledger for the customer
    await updateCustomerWallet(
      collectionData.customer_id,
      pickup.id,
      pointsEarned,
      fundAllocation.user_wallet,
      `Collection of ${updatedPickup.total_kg}kg - ${pointsEarned} points earned`
    );

    const result: CollectionResult = {
      pickup_id: pickup.id,
      total_kg: updatedPickup.total_kg,
      total_value: updatedPickup.total_value,
      environmental_impact: environmentalImpact,
      points_earned: pointsEarned,
      fund_allocation: fundAllocation
    };

    console.log('🎉 Live collection submitted successfully!', result);
    return result;

  } catch (error) {
    console.error('❌ Error in submitLiveCollection:', error);
    throw error;
  }
}

/**
 * Calculate environmental impact for a collection
 */
async function calculateCollectionImpact(materials: CollectionMaterial[]) {
  let totalCo2Saved = 0;
  let totalWaterSaved = 0;
  let totalLandfillSaved = 0;

  for (const material of materials) {
    const { data: materialData, error } = await supabase
      .from('materials')
      .select('co2_per_kg, water_l_per_kg, landfill_l_per_kg')
      .eq('id', material.material_id)
      .single();

    if (!error && materialData) {
      totalCo2Saved += (materialData.co2_per_kg || 0) * material.kilograms;
      totalWaterSaved += (materialData.water_l_per_kg || 0) * material.kilograms;
      totalLandfillSaved += (materialData.landfill_l_per_kg || 0) * material.kilograms;
    }
  }

  return {
    co2_saved: Math.round(totalCo2Saved * 100) / 100,
    water_saved: Math.round(totalWaterSaved * 100) / 100,
    landfill_saved: Math.round(totalLandfillSaved * 100) / 100,
    trees_equivalent: Math.round((totalCo2Saved / 22.0) * 100) / 100 // 22kg CO2 = 1 tree
  };
}

/**
 * Calculate points earned for a collection
 */
async function calculateCollectionPoints(materials: CollectionMaterial[]) {
  let totalPoints = 0;

  for (const material of materials) {
    const { data: materialData, error } = await supabase
      .from('materials')
      .select('rate_per_kg, points_per_rand')
      .eq('id', material.material_id)
      .single();

    if (!error && materialData) {
      const materialValue = material.kilograms * (materialData.rate_per_kg || 0);
      const pointsForMaterial = materialValue * (materialData.points_per_rand || 1);
      totalPoints += pointsForMaterial;
    }
  }

  return Math.round(totalPoints);
}

/**
 * Calculate fund allocation based on material types
 * Aluminium: 100% to customer wallet
 * PET/Plastic: 100% to Green Scholar Fund
 * Other materials: 70% Green Scholar, 30% Customer Wallet
 */
async function calculateFundAllocation(materials: CollectionMaterial[], totalValue: number) {
  let aluminiumValue = 0;
  let petValue = 0;
  let otherValue = 0;

  // Calculate values by material type
  for (const material of materials) {
    const { data: materialData, error } = await supabase
      .from('materials')
      .select('name, rate_per_kg')
      .eq('id', material.material_id)
      .single();

    if (!error && materialData) {
      const materialValue = material.kilograms * materialData.rate_per_kg;
      
      if (materialData.name === 'Aluminium Cans') {
        aluminiumValue += materialValue;
      } else if (materialData.name === 'PET') {
        petValue += materialValue;
      } else {
        otherValue += materialValue;
      }
    }
  }

  // Calculate allocations
  const greenScholarFund = petValue + (otherValue * 0.7);
  const userWallet = aluminiumValue + (otherValue * 0.3);

  return {
    green_scholar_fund: Math.round(greenScholarFund * 100) / 100,
    user_wallet: Math.round(userWallet * 100) / 100,
    breakdown: {
      aluminium_customer: aluminiumValue,
      pet_green_scholar: petValue,
      other_green_scholar: otherValue * 0.7,
      other_customer: otherValue * 0.3
    }
  };
}

/**
 * Update customer wallet with points and credits
 */
async function updateCustomerWallet(
  customer_id: string,
  pickup_id: string,
  points: number,
  zar_amount: number,
  description: string
) {
  try {
    const { error } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: customer_id,
        pickup_id: pickup_id,
        points: points,
        zar_amount: zar_amount,
        fund_allocation: 0, // This is the Green Scholar portion
        description: description
      });

    if (error) {
      console.error('⚠️ Warning: Failed to update wallet:', error);
      // Don't fail the entire collection for wallet errors
    } else {
      console.log(`✅ Wallet updated: ${points} points, R${zar_amount} credits`);
    }
  } catch (error) {
    console.error('⚠️ Warning: Wallet update failed:', error);
  }
}

/**
 * Get customer's collection history and metrics
 */
export async function getCustomerCollectionMetrics(customer_id: string) {
  try {
    const { data, error } = await supabase
      .from('customer_dashboard_view')
      .select('*')
      .eq('customer_id', customer_id);

    if (error) {
      console.error('❌ Error fetching customer metrics:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getCustomerCollectionMetrics:', error);
    throw error;
  }
}

/**
 * Get real-time collection updates for a customer
 */
export function subscribeToCustomerCollections(customer_id: string, callback: (data: any) => void) {
  return supabase
    .channel(`customer_collections_${customer_id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pickups',
        filter: `customer_id=eq.${customer_id}`
      },
      callback
    )
    .subscribe();
}
