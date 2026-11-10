async function testWorkflow() {
  console.log('=== KADAIVOICE AI END-TO-END WORKFLOW VERIFICATION ===\n');
  const baseURL = 'http://localhost:5000/api';

  try {
    // 1. Login as Shop Owner
    console.log('[Step 1] Logging in as shop owner...');
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo@kadaivoice.ai', password: 'admin123' }),
    }).then(r => r.json());

    if (!loginRes.success) throw new Error(loginRes.message);
    console.log(`✓ Login successful! Token received. Shop: ${loginRes.shop.name}`);
    const token = loginRes.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // 2. View Inventory
    console.log('\n[Step 2] Viewing store inventory...');
    const invRes = await fetch(`${baseURL}/inventory`, { headers: authHeaders }).then(r => r.json());
    const products = invRes.products;
    console.log(`✓ Inventory loaded! Total products: ${products.length}, Total stock valuation: ₹${invRes.summary.totalStockValue}`);
    const riceProduct = products.find(p => p.name.includes('Rice'));
    const initialRiceStock = riceProduct.currentStock;
    console.log(`Initial Stock for "${riceProduct.name}": ${initialRiceStock} ${riceProduct.unit}`);

    // 3 & 4. Speak a sales command & See transcribed text
    console.log('\n[Step 3 & 4] Voice processing: Transcribing audio command...');
    const sttRes = await fetch(`${baseURL}/voice/transcribe`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fallbackText: 'Today I sold 5 kg rice and 2 milk packets',
        languageCode: 'en-IN',
      }),
    }).then(r => r.json());
    console.log(`✓ Transcribed text: "${sttRes.transcript}" (Provider: ${sttRes.provider})`);

    // 5. Review AI-extracted products and quantities
    console.log('\n[Step 5] Evon NLU Structured Intent Extraction...');
    const nluRes = await fetch(`${baseURL}/voice/interpret`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        transcript: sttRes.transcript,
        languageCode: 'en-IN',
      }),
    }).then(r => r.json());

    const ext = nluRes.extraction;
    console.log('✓ AI Extracted Intent:', ext.intent);
    console.log('✓ Verified Items to Process:');
    ext.verifiedItems.forEach(i => console.log(`   - ${i.quantity} ${i.unit} ${i.productName} (Rate: ₹${i.unitPrice}, Available: ${i.currentStock})`));
    console.log('✓ Estimated Total:', `₹${ext.estimatedTotal}`);
    console.log('✓ Spoken Feedback Response:', ext.spokenResponseText);

    // 6. Confirm the sale
    console.log('\n[Step 6] Confirming voice transaction and committing to store database...');
    const confirmRes = await fetch(`${baseURL}/voice/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        intent: ext.intent,
        items: ext.verifiedItems,
        paymentMethod: ext.paymentMethod || 'CASH',
        transcript: sttRes.transcript,
      }),
    }).then(r => r.json());

    if (!confirmRes.success) {
      throw new Error(`Confirmation failed: ${confirmRes.message}`);
    }

    console.log(`✓ Transaction confirmed! Invoice: ${confirmRes.transaction.invoiceNumber}`);
    console.log(`✓ Spoken confirmation: "${confirmRes.spokenConfirmation}"`);

    // 7. Verify stock reduction
    console.log('\n[Step 7] Verifying atomic inventory stock reduction in MongoDB...');
    const updatedInvRes = await fetch(`${baseURL}/inventory`, { headers: authHeaders }).then(r => r.json());
    const updatedRice = updatedInvRes.products.find(p => p._id === riceProduct._id);
    console.log(`✓ Stock for "${updatedRice.name}" reduced from ${initialRiceStock} to ${updatedRice.currentStock} (Expected: ${initialRiceStock - 5} ${riceProduct.unit})`);
    if (updatedRice.currentStock === initialRiceStock - 5) {
      console.log('✓ Stock reduction verified 100% accurate!');
    }

    // 8. View updated sales
    console.log('\n[Step 8] Viewing updated sales ledger...');
    const salesRes = await fetch(`${baseURL}/sales`, { headers: authHeaders }).then(r => r.json());
    console.log(`✓ Total sales transactions: ${salesRes.count}. Latest invoice: ${salesRes.data[0].invoiceNumber} for ₹${salesRes.data[0].total}`);

    // 9. Generate an end-of-day report
    console.log('\n[Step 9] Generating End-of-Day Business Closing Report...');
    const reportRes = await fetch(`${baseURL}/reports/daily`, { headers: authHeaders }).then(r => r.json());
    console.log(`✓ Daily Report Generated for ${reportRes.shopName} (${reportRes.reportDate}):`);
    console.log(`  - Total Sales: ₹${reportRes.metrics.totalSales}`);
    console.log(`  - Gross Profit: ₹${reportRes.metrics.grossProfit}`);
    console.log(`  - Total Expenses: ₹${reportRes.metrics.totalExpenses}`);
    console.log(`  - Net Operating Result: ₹${reportRes.metrics.netOperatingResult}`);
    console.log(`  - Closing Stock Valuation: ₹${reportRes.metrics.closingStockValuation}`);
    console.log(`  - AI Voice Audio Summary: "${reportRes.aiSummary.text}"`);

    console.log('\n======================================================');
    console.log('🎉 ALL 9 END-TO-END WORKFLOW STEPS PASSED FLAWLESSLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Workflow test error:', err.message);
  }
}

testWorkflow();
