"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Recycle, Calculator, Leaf, Target } from "lucide-react";
import { useState } from "react";

export default function CalculatorPage() {
  const [materials, setMaterials] = useState([
    { name: "Plastic", kg: 0, rate: 5 },
    { name: "Paper", kg: 0, rate: 3 },
    { name: "Glass", kg: 0, rate: 4 },
    { name: "Metal", kg: 0, rate: 6 }
  ]);

  const calculateTotal = () => {
    return materials.reduce((total, material) => {
      return total + (material.kg * material.rate);
    }, 0);
  };

  const calculateEnvironmentalImpact = () => {
    const totalKg = materials.reduce((total, material) => total + material.kg, 0);
    return {
      co2Saved: totalKg * 2.5, // kg of CO2 saved
      waterSaved: totalKg * 100, // liters of water saved
      landfillSaved: totalKg * 0.8 // kg of landfill space saved
    };
  };

  const updateMaterial = (index: number, kg: number) => {
    const newMaterials = [...materials];
    newMaterials[index].kg = kg;
    setMaterials(newMaterials);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Recycling Calculator</h1>
        <p className="text-muted-foreground">Calculate environmental impact and rewards for recycling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Input */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span>Material Input</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {materials.map((material, index) => (
              <div key={material.name} className="flex items-center space-x-4">
                <Label className="w-20 text-sm font-medium">{material.name}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={material.kg}
                  onChange={(e) => updateMaterial(index, parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">kg</span>
                <span className="text-sm font-medium">@ R{material.rate}/kg</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-success" />
              <span>Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Financial Results */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-semibold mb-2">Financial Impact</h3>
              <div className="text-2xl font-bold text-primary">
                R {calculateTotal().toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Total earnings from recycling</p>
            </div>

            {/* Environmental Impact */}
            <div className="space-y-3">
              <h3 className="font-semibold">Environmental Impact</h3>
              {(() => {
                const impact = calculateEnvironmentalImpact();
                return (
                  <>
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span className="text-sm">CO2 Saved: {impact.co2Saved.toFixed(1)} kg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Water Saved: {impact.waterSaved.toFixed(0)} liters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Landfill Saved: {impact.landfillSaved.toFixed(1)} kg</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
