# 🌱 Green Scholar Fund System

## Overview

The Green Scholar Fund is a comprehensive system that manages educational funding through PET material donations and direct contributions. It supports schools and child-headed homes across South Africa by automatically allocating funds from recycled materials and enabling direct donations.

## 🎯 Key Features

### 1. **PET Donation Tracking**
- **100% of PET material value** goes to Green Scholar Fund
- **70% of other materials** go to Green Scholar Fund, 30% to user wallet
- Automatic processing during collection approval
- Detailed tracking of material contributions

### 2. **Direct Donations**
- Users can make monetary donations
- Choose specific schools or child-headed homes
- Option for anonymous donations
- "It matters not" option for general fund

### 3. **Beneficiary Management**
- **Schools**: Primary, secondary, special needs schools
- **Child-Headed Homes**: Support for vulnerable children
- Complete contact and demographic information
- Active/inactive status management

### 4. **Admin Dashboard**
- Real-time fund balance tracking
- Transaction history and analytics
- Beneficiary management interface
- Monthly statistics and reporting

## 🗄️ Database Schema

### Core Tables

#### `green_scholar_transactions`
Tracks all fund transactions (PET donations, direct donations, expenses)

#### `green_scholar_fund_balance`
Maintains current fund balance and totals

#### `schools`
Registered schools that can receive funding

#### `child_headed_homes`
Child-headed homes that can receive support

#### `user_donations`
User-initiated direct donations

#### `collection_green_scholar_contributions`
Detailed breakdown of how collection materials contribute to the fund

## 🚀 Setup Instructions

### 1. Database Setup
```sql
-- Run the complete setup script
\i setup-green-scholar-fund.sql
```

### 2. Verify Setup
```sql
-- Check that all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%green%' OR table_name LIKE '%school%' OR table_name LIKE '%child%';

-- Check initial data
SELECT 'Schools' as type, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Child Homes' as type, COUNT(*) as count FROM child_headed_homes
UNION ALL
SELECT 'Fund Balance' as type, total_balance::text as count FROM green_scholar_fund_balance;
```

## 📱 User Interface

### Admin Dashboard
- **Location**: `/admin` → Green Scholar Fund
- **Features**:
  - Fund balance overview
  - Transaction history
  - Beneficiary management
  - Monthly statistics

### Donation Page
- **Location**: `/donate`
- **Features**:
  - Donation form with school selection
  - Beneficiary information
  - Impact statistics
  - Call-to-action for recycling

## 🔧 API Functions

### Core Functions

#### `process_pet_donation_from_collection()`
Processes PET donations when collections are approved

#### `create_direct_donation()`
Creates direct donations from users

#### `get_green_scholar_monthly_stats()`
Returns monthly fund statistics

#### `get_beneficiary_stats()`
Returns beneficiary funding statistics

## 💰 Fund Allocation Logic

### Collection Materials
- **PET/Plastic**: 100% → Green Scholar Fund
- **Aluminium**: 100% → User Wallet
- **Other Materials**: 70% → Green Scholar Fund, 30% → User Wallet

### Direct Donations
- **Specific School**: 100% → Selected School
- **Child-Headed Home**: 100% → Selected Home
- **General Fund**: 100% → General Fund

## 📊 Monitoring & Analytics

### Key Metrics
- Total fund balance
- PET donations vs direct donations
- Monthly contribution trends
- Beneficiary funding distribution
- Collection material breakdown

### Reports
- Monthly fund reports
- Beneficiary impact reports
- Collection contribution analysis
- Donor activity reports

## 🔒 Security & Permissions

### Row Level Security (RLS)
- **Schools/Child Homes**: Public read, admin write
- **Transactions**: Admin only
- **User Donations**: Users can create/view own, admins can manage all

### User Roles
- **Admin**: Full access to all fund management
- **Users**: Can make donations and view public beneficiary info
- **Collectors**: Collections automatically processed

## 🎨 UI Components

### Admin Components
- `GreenScholarFund.tsx` - Main admin interface
- Fund balance cards
- Transaction tables
- Beneficiary management

### User Components
- `DonationForm.tsx` - Donation form
- School/child home selection
- Anonymous donation option
- Impact display

## 📈 Future Enhancements

### Planned Features
- [ ] Recurring donation subscriptions
- [ ] Donation goal tracking
- [ ] Impact stories and testimonials
- [ ] Mobile app integration
- [ ] Email notifications for donations
- [ ] Advanced reporting and analytics
- [ ] Integration with external payment systems

### Potential Integrations
- [ ] Payment gateway integration (PayPal, Stripe)
- [ ] SMS notifications
- [ ] Social media sharing
- [ ] Donor recognition system
- [ ] Automated impact reporting

## 🐛 Troubleshooting

### Common Issues

#### Fund Balance Not Updating
```sql
-- Check if trigger is working
SELECT * FROM green_scholar_fund_balance;

-- Manually update balance
SELECT update_green_scholar_balance();
```

#### PET Donations Not Processing
```sql
-- Check collection materials
SELECT * FROM collection_green_scholar_contributions 
WHERE collection_id = 'your-collection-id';

-- Check transactions
SELECT * FROM green_scholar_transactions 
WHERE source_id = 'your-collection-id';
```

#### Beneficiary Data Missing
```sql
-- Check if beneficiaries are active
SELECT * FROM schools WHERE is_active = true;
SELECT * FROM child_headed_homes WHERE is_active = true;
```

## 📞 Support

For technical support or questions about the Green Scholar Fund system:

1. Check the troubleshooting section above
2. Review the database logs for errors
3. Verify RLS policies are correctly set
4. Ensure all functions have proper permissions

## 🎉 Success Metrics

The Green Scholar Fund system is considered successful when:

- ✅ PET donations are automatically processed
- ✅ Users can make direct donations with school selection
- ✅ Admin can track fund balance and transactions
- ✅ Beneficiaries are properly managed
- ✅ Fund allocation follows the specified logic
- ✅ All security policies are enforced

---

**Built with ❤️ for education and environmental sustainability**
