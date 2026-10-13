import json,urllib.request,urllib.error,uuid
from pathlib import Path
results=[]
for endpoint,method,country,expected in [('order.php','rib','MA','method_invalid'),('order.php','iban','FR','method_invalid'),('order.php','cod','US','payment_destination_invalid'),('zazu-checkout.php','iban','MA','method_invalid')]:
    body={'text':'Verification of disabled payment method; no valid order items.', '_hp':'','order':{'number':'YZA-VERIFY'+uuid.uuid4().hex[:8].upper(),'operationId':'ord_'+uuid.uuid4().hex,'method':method,'countryCode':country,'lang':'fr','items':[],'totalDh':100,'shipping':{'name':'Verification only','email':'test@example.invalid','phone':'0612345678','country':country,'address':'Verification only','city':'Verification'}}}
    request=urllib.request.Request('https://yza-shop.com/'+endpoint,data=json.dumps(body).encode(),headers={'Content-Type':'application/json','User-Agent':'Python-urllib/3.13','Origin':'https://yza-shop.com','Referer':'https://yza-shop.com/checkout.html'})
    try:
        with urllib.request.urlopen(request,timeout=30) as response:status=response.status;answer=json.load(response)
    except urllib.error.HTTPError as e:status=e.code;answer=json.load(e)
    assert status==422 and answer.get('error')==expected and not answer.get('accepted'),(endpoint,status,answer)
    results.append({'endpoint':endpoint,'method':method,'countryCode':country,'httpStatus':status,'error':answer['error']})
Path(__file__).with_name('live-endpoint-guards.json').write_text(json.dumps({'ok':True,'tests':results},indent=2)+'\n')
print('Live endpoint guards verified:',len(results),'rejections; no valid order submitted.')
