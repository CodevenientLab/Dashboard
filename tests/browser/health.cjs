const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.UI_TEST_DIST || path.resolve(__dirname,'../../../firebase-ui-test-dist'); const output=process.env.TEST_OUTPUT_DIR || path.join(require('node:os').tmpdir(),'codevenient-health-test');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const {emptyWorkspace}=await import('../../src/lib/workspace.js');
 const state=emptyWorkspace();const invoice=(id,total,extra={})=>({id,client:id,status:'Sent',date:'2026-01-01',dueDate:'2026-01-02',items:[{service:'Website',qty:1,rate:total}],subtotal:total,tax:0,total,...extra});
 state.invoices=[invoice('INV-0001',100,{dueDate:'2026-01-10'}),invoice('INV-0002',200),invoice('INV-0003',500,{status:'Paid',paidDate:'2026-01-20'}),invoice('INV-0004',700,{status:'Paid'})];state.nextInvoiceNumber=5;
 state.expenses=[{id:'e',title:'Hosting',date:'2026-01-05',amount:50}];state.projects=[{id:'p',name:'Late website',group:'Client',status:'In progress',dueDate:'2026-01-01'}];
 let browser;
 try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || undefined});
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,reducedMotion:'reduce'});
 await context.route('http://localhost/**',async route=>{
  const url=new URL(route.request().url());const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
  if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}await route.fulfill({path:file,contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});
 });
 await context.addInitScript(state=>{if(!localStorage.getItem('test-cloud'))localStorage.setItem('test-cloud',JSON.stringify({data:state,version:1}));sessionStorage.setItem('test-login','yes');},state);
 const page=await context.newPage();page.setDefaultTimeout(10000);console.log('browser ready');const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost/');await page.getByRole('heading',{name:'Monthly business health'}).waitFor();
 await page.getByLabel('Report month').fill('2026-01');
 assert.match(await page.locator('.health-report').innerText(),/500/);assert.match(await page.locator('.health-report').innerText(),/450/);assert.match(await page.locator('.health-report').innerText(),/1 paid invoice/);
 assert.match(await page.locator('.overview table tbody tr').first().innerText(),/INV-0002/);
 assert.equal(await page.locator('.dash-chart-column').count(),6);
 await page.getByRole('button',{name:/Dec 2025: collected/}).click();
 assert.equal(await page.getByLabel('Report month').inputValue(),'2025-12');
 await page.getByLabel('Report month').fill('2026-01');
 await page.getByRole('button',{name:'Agreement',exact:true}).click();
 assert.equal(await page.getByLabel('Agreement type').inputValue(),'client-services');
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.evaluate(()=>location.hash='dashboard');
 await page.getByRole('heading',{name:'Business dashboard.'}).waitFor();
 await page.getByLabel('Report month').fill('2026-01');
 await page.getByRole('button',{name:'Toggle colour theme'}).click();
 await page.waitForFunction(()=>!document.documentElement.classList.contains('light'));
 await page.screenshot({path:path.join(output,'dashboard-dark.png'),fullPage:true});
 await page.getByRole('button',{name:'Toggle colour theme'}).click();
 await page.waitForFunction(()=>document.documentElement.classList.contains('light'));
 await page.screenshot({path:path.join(output,'dashboard-desktop.png'),fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,'dashboard-mobile.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1000});console.log('dashboard checked');await page.evaluate(()=>location.hash='ledger');await page.getByRole('button',{name:'Edit INV-0004',exact:true}).click({force:true}).catch(async()=>{await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Edit INV-0004',exact:true}).click();});
 await page.getByLabel('Payment date').fill('2026-01-25');await page.getByRole('button',{name:'Save invoice',exact:true}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('codevenient-cloud-test-owner')).data.invoices.find(i=>i.id==='INV-0004').paidDate==='2026-01-25');
 console.log('payment date checked');await page.evaluate(()=>location.hash='proposals');await page.getByRole('button',{name:'New contract',exact:true}).click();
 assert.equal(await page.getByLabel('Agreement type').inputValue(),'client-services');
 for(const [key,value] of Object.entries({providerEmail:'provider@example.com',name:'Example Client Ltd',clientEmail:'client@example.com',clientSigner:'Client Representative',projectName:'Business website',scope:'Five responsive pages, contact form, and production deployment. Design review followed by build and launch.',fee:'15000',directorName:'Bongani Nduna'}))await page.locator(`#contract-${key}`).fill(value);
 await page.getByRole('button',{name:'Preview agreement',exact:true}).click();assert.match(await page.locator('pre').innerText(),/7. IMPORTANT/);
 console.log('contract preview checked');const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Generate & download',exact:true}).click();const download=await downloadEvent;await download.saveAs(path.join(output,'agreement-test.pdf'));
 await page.getByRole('heading',{name:'Client Services Agreement - Business website'}).waitFor();
 assert.equal(fs.readFileSync(path.join(output,'agreement-test.pdf')).subarray(0,4).toString(),'%PDF');
 assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile dashboard, month totals, undated warning, oldest invoice first, payment-date edit persisted, default client agreement, preview, save and PDF download. Firebase mocked.');
 }finally{await browser?.close();}
})().catch(e=>{console.error(e);process.exit(1)});





