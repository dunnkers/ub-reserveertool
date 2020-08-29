import requests
import json

url = "https://libcal.rug.nl/ajax/calendar/list?c=7564&date=0000-00-00&perpage=48&page=1&audience=undefined&cats=&camps=&inc=0&callback=s_lc_calendar_card"
response = json.loads(requests.get(url).text)
print(response)