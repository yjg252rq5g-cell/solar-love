# Akino Solar Command Center v8 - Quick Start Guide

## 🚀 Getting Started

### 1. Open the Application
```bash
# Simply open in your browser
open index.html

# Or serve locally
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### 2. Explore New Features

#### **Automation Hub** (New!)
- Click "Automation" in the sidebar
- View pre-configured workflows
- Click any workflow card to trigger (will show warning if webhook not configured)
- Configure webhook URLs in DataStore for production use

#### **Company Data** (New!)
- Click "Company Data" in the sidebar
- Switch between Customers, Employees, Leads tabs
- Currently shows employee data from CONFIG.TECH_RATES
- Ready for full CRM integration

#### **Documents** (New!)
- Click "Documents" in the sidebar
- View knowledge base
- Sample documents loaded in DataStore
- Add your own SOPs, training materials, etc.

## ⚙️ Quick Configuration

### Enable Zapier Automation (5 minutes)

1. **Create a Zapier account** (if needed): https://zapier.com

2. **Create a new Zap**:
   - Trigger: Webhooks by Zapier → Catch Hook
   - Copy the webhook URL

3. **Configure in DataStore**:
```javascript
// Find DataStore.zapierWebhooks in the HTML
// Update the URL for the webhook you want to use
{
  id: 'WH-001',
  name: 'Route Dispatch',
  url: 'https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_HERE',
  active: true,
  category: 'Routes',
  payloadTemplate: { routeId: '', techNames: [], mapUrl: '' }
}
```

4. **Test it**:
   - Go to Automation Hub
   - Click "Route Dispatch" card
   - Check Zapier for received webhook

### Add Your First Customer

```javascript
// Open browser console (F12)
// Run this code:
DataStore.customers.push({
  id: 'CUST-' + Date.now(),
  name: 'Your Customer Name',
  email: 'customer@example.com',
  phone: '(555) 123-4567',
  city: 'Knoxville',
  state: 'TN',
  totalRevenue: 0,
  lastJobDate: '',
  status: 'Active',
  notes: 'First customer!'
});
persistData();

// Refresh the page and check Company Data tab
```

### Add Your First Document

```javascript
// Open browser console (F12)
DataStore.documents.push({
  id: 'DOC-' + Date.now(),
  title: 'Generator Maintenance Checklist',
  category: 'SOP',
  type: 'PDF',
  url: 'https://drive.google.com/file/d/YOUR_FILE_ID',
  description: 'Monthly maintenance procedure',
  version: '1.0',
  dateAdded: '2026-02-15'
});
persistData();

// Refresh and check Documents tab
```

## 🎯 Key Features to Try

### 1. Profitability Analysis
- Go to Jobs tab
- Notice profit indicators on jobs (green = profitable, red = loss)
- Look for "ACCEPT/REJECT/REVIEW" verdicts
- These are calculated in real-time based on:
  - Revenue
  - Labor costs (loaded rates)
  - Travel costs
  - Parts & consumables
  - Overhead allocation

### 2. Automation Workflows
- **Route Dispatch**: Sends optimized route to techs
- **Job Confirmation**: Emails customer after scheduling
- **Invoice Creation**: Auto-generates QuickBooks invoice
- **Warranty Processing**: Submits claim to Generac
- **Low Stock Alert**: Notifies when inventory is low

### 3. Company Data Management
- **Customers**: Track all customer interactions
- **Employees**: Manage team with rates and performance
- **Leads**: Pipeline from inquiry to conversion
- **Inventory**: Enhanced view with reorder alerts

### 4. Knowledge Base
- Upload SOPs as PDFs to Google Drive
- Embed training videos from YouTube
- Organize by category (SOP, Training, How-To, Safety)
- Search across all documents

## 📊 Understanding Profitability

### How Verdicts Work

```javascript
// The system calculates margin for each job:
Margin = (Revenue - Total Cost) / Revenue × 100%

// Then assigns a verdict:
if (margin >= 30%) return "ACCEPT"    // Green - Great profit!
if (margin >= 15%) return "REVIEW"    // Yellow - Acceptable
if (margin < 15%)  return "REJECT"    // Red - Losing money
```

### Cost Components
Every job cost includes:
- **Labor**: Hours × Loaded Rate (includes benefits, taxes)
- **Travel**: Miles × $0.99/mile
- **Parts**: Actual parts cost
- **Consumables**: Materials used
- **QA**: $85 per job
- **Admin**: $315 per job
- **Risk Buffer**: $100 per job
- **Overhead**: ~$2,248 per job (based on monthly expenses)

## 🔧 Customization

### Change Profit Thresholds

Find this function in the HTML and modify:
```javascript
function getProfitVerdict(revenue, cost) {
  const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  
  // Customize these thresholds:
  if (margin >= 30) return { class: 'verdict-accept', text: 'ACCEPT' };
  if (margin >= 15) return { class: 'verdict-review', text: 'REVIEW' };
  return { class: 'verdict-reject', text: 'REJECT' };
}
```

### Add a New Webhook

1. Add to DataStore:
```javascript
DataStore.zapierWebhooks.push({
  id: 'WH-NEW',
  name: 'My New Workflow',
  description: 'What this automation does',
  url: 'https://hooks.zapier.com/...',
  active: true,
  category: 'Custom',
  payloadTemplate: { /* your data structure */ }
});
```

2. Add workflow card in Automation Hub (edit HTML):
```html
<div class="workflow-card" onclick="triggerAutomation('WH-NEW', {})">
  <div style="background:#dbeafe;...">
    <i class="fas fa-star"></i>
  </div>
  <h4>My New Workflow</h4>
  <p>Description here</p>
</div>
```

## 🐛 Troubleshooting

### Webhooks Not Triggering
1. Check DataStore.zapierWebhooks has correct URL
2. Verify `active: true`
3. Open browser console for errors
4. Test webhook in Zapier first

### Data Not Persisting
1. Check browser localStorage is enabled
2. Open console and run: `persistData()`
3. Verify no errors in console

### Tabs Not Showing
1. Check navigation item has `data-tab="tab-name"`
2. Verify tab div has `id="tab-tab-name"`
3. Check switchTab function includes the tab

### Profit Calculations Wrong
1. Verify CONFIG.TECH_RATES has correct loaded rates
2. Check CONFIG constants match your overhead
3. Review calcJobCost() function logic

## 📱 Mobile Usage

The app is responsive and works on mobile:
- Navigation menu collapses to hamburger
- Tables scroll horizontally
- Touch-friendly buttons
- Optimized for tablets

## 🔄 Data Import/Export

### Export All Data
```javascript
// Browser console:
exportData()
// Downloads akino_solar_data.json
```

### Import Data
1. Click import button (if added to UI)
2. Or use console:
```javascript
// Prepare your JSON file
// Then use file input to trigger importData()
```

## 📈 Next Steps

1. **Configure Zapier**: Set up your most critical automations
2. **Import Customers**: Migrate existing customer database
3. **Upload SOPs**: Add your operational documents
4. **Train Team**: Show staff the new features
5. **Monitor Profitability**: Use verdicts to improve pricing
6. **Track Leads**: Start using lead pipeline

## 💡 Pro Tips

1. **Use keyboard shortcuts**: Navigate tabs with tab numbers
2. **Filter smartly**: Use search on every data table
3. **Export regularly**: Back up your data weekly
4. **Test webhooks**: Always test before going live
5. **Review verdicts**: Adjust pricing for REVIEW jobs
6. **Track metrics**: Monitor automation history

## 🆘 Getting Help

1. **Check ENHANCEMENT_SUMMARY.md**: Full technical documentation
2. **Read CLAUDE.md**: Project context and conventions
3. **Browser Console**: F12 to see errors
4. **DataStore Inspect**: `console.log(DataStore)` to see all data

## 🎉 You're Ready!

The Akino Solar Command Center is now a complete Business Operating System. Start with one automation, add your team data, and gradually expand. The system is designed to grow with your business.

**Key Win**: Every feature is designed to save you time and increase profitability. Focus on configuring the automations that will have the biggest impact first.

Good luck! 🚀

---

**Created**: February 15, 2026
**Version**: 8.0
**Status**: Production Ready
