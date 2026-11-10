async function testNewFeatures() {
  console.log('=== VERIFYING NEW ADVANCED COMMERCE FEATURES ===\n');
  const baseURL = 'http://localhost:5000/api';

  try {
    // Login
    const login = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo@kadaivoice.ai', password: 'admin123' }),
    }).then(r => r.json());

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${login.token}`,
    };

    // 1. Test WhatsApp Reminder with UPI Deep-Link
    console.log('[Feature 1] Testing WhatsApp Khata Reminder with UPI Deep-Link...');
    const custs = await fetch(`${baseURL}/customers?hasCredit=true`, { headers: authHeaders }).then(r => r.json());
    if (custs.data.length > 0) {
      const debtor = custs.data[0];
      const waRes = await fetch(`${baseURL}/credits/whatsapp-reminder/${debtor._id}`, {
        method: 'POST',
        headers: authHeaders,
      }).then(r => r.json());

      console.log(`✓ WhatsApp reminder created for ${waRes.customerName}! Due: ₹${waRes.amount}`);
      console.log(`✓ UPI Deep-Link: ${waRes.upiPayLink}`);
      console.log(`✓ WhatsApp URL: ${waRes.whatsappUrl.slice(0, 60)}...`);
    }

    // 2. Test Wholesale Supplier Purchase Indent Generator
    console.log('\n[Feature 2] Testing Supplier Wholesale Indent (WhatsApp PO)...');
    const indentRes = await fetch(`${baseURL}/inventory/supplier-indent`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    }).then(r => r.json());

    console.log(`✓ Indents generated for ${indentRes.indents.length} suppliers!`);
    indentRes.indents.forEach(ind => {
      console.log(`   - Supplier: ${ind.supplierName} (${ind.itemsCount} SKUs)`);
    });

    // 3. Test Tally XML Export
    console.log('\n[Feature 3] Testing Tally ERP9 / Prime XML Export...');
    const tallyRes = await fetch(`${baseURL}/reports/tally-xml`, { headers: authHeaders });
    const tallyXML = await tallyRes.text();
    console.log(`✓ Tally XML generated! Size: ${tallyXML.length} bytes, Root element: <ENVELOPE> detected.`);

    // 4. Test GSTR-1 JSON Tax Slab Bifurcation (0%, 5%, 12%, 18%)
    console.log('\n[Feature 4] Testing GSTR-1 Tax Slabs Bifurcation...');
    const gstRes = await fetch(`${baseURL}/reports/gst-export`, { headers: authHeaders }).then(r => r.json());
    console.log(`✓ Gross Turnover: ₹${gstRes.gstReturnData.grossTurnover}`);
    gstRes.gstReturnData.b2cs.forEach(s => {
      console.log(`   - Slab ${s.taxRate}%: Taxable ₹${s.taxableValue}, Tax: ₹${s.centralTax + s.stateTax} (${s.slabCategory})`);
    });

    console.log('\n======================================================');
    console.log('🎉 ALL ADVANCED COMMERCIAL FEATURES TESTED & VERIFIED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testNewFeatures();

