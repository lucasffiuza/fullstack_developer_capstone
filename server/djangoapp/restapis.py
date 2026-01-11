# Uncomment the imports below before you add the function code
import requests
import os
from dotenv import load_dotenv

load_dotenv()

backend_url = os.getenv(
    'backend_url', default="http://localhost:3030")
sentiment_analyzer_url = os.getenv(
    'sentiment_analyzer_url',
    default="http://localhost:5050/")

def get_request(endpoint, **kwargs):
    params = ""
    if(kwargs):
        for key,value in kwargs.items():
            params=params+key+"="+value+"&"

    request_url = backend_url+endpoint
    if params:
        request_url = request_url+"?"+params.rstrip("&")

    print("GET from {} ".format(request_url))
    try:
        response = requests.get(request_url, timeout=5)
        response.raise_for_status()  # Raise exception for bad status codes
        result = response.json()
        print(f"Response received: {len(result) if isinstance(result, list) else 'not a list'} items")
        return result
    except requests.exceptions.ConnectionError as e:
        print(f"Connection error: Cannot connect to {request_url}. Error: {e}")
        return []
    except requests.exceptions.Timeout:
        print(f"Timeout: Request to {request_url} timed out")
        return []
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error: {e.response.status_code} - {e.response.text}")
        return []
    except Exception as e:
        print(f"Network exception occurred: {type(e).__name__}: {e}")
        return []

def analyze_review_sentiments(text):
    request_url = sentiment_analyzer_url+"analyze/"+text
    try:
        # Call get method of requests library with URL and parameters
        response = requests.get(request_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError as e:
        print(f"Sentiment analyzer connection error: {e}")
        return {"sentiment": "neutral"}  # Return default instead of None
    except requests.exceptions.Timeout:
        print(f"Sentiment analyzer timeout")
        return {"sentiment": "neutral"}
    except Exception as err:
        print(f"Sentiment analyzer error: {err}")
        return {"sentiment": "neutral"}  # Return default instead of None
        
# def post_review(data_dict):
def post_review(data_dict):
    request_url = backend_url+"/insert_review"
    try:
        response = requests.post(request_url,json=data_dict)
        print(response.json())
        return response.json()
    except:
        print("Network exception occurred")
