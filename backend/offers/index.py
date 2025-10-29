'''
Business: Управление предложениями заработка - получение списка активных предложений
Args: event - dict с httpMethod, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict со списком предложений
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Auth',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    if method == 'GET':
        cursor.execute("SELECT * FROM offers WHERE is_active = true ORDER BY created_at DESC")
        offers = cursor.fetchall()
        cursor.close()
        conn.close()
        
        result = []
        for offer in offers:
            result.append({
                'id': offer['id'],
                'title': offer['title'],
                'description': offer['description'],
                'reward': offer['reward'],
                'telegram_link': offer['telegram_link'],
                'views_count': offer.get('views_count', 0),
                'created_at': offer['created_at'].isoformat() if offer['created_at'] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'offers': result}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        headers = event.get('headers', {})
        admin_auth = headers.get('X-Admin-Auth') or headers.get('x-admin-auth')
        
        if admin_auth != 'admin123':
            cursor.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        title = body_data.get('title')
        description = body_data.get('description')
        reward = body_data.get('reward')
        telegram_link = body_data.get('telegram_link')
        
        cursor.execute(
            "INSERT INTO offers (title, description, reward, telegram_link, views_count) VALUES (%s, %s, %s, %s, 0) RETURNING id",
            (title, description, reward, telegram_link)
        )
        offer_id = cursor.fetchone()['id']
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'id': offer_id, 'message': 'Offer created'}),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        params = event.get('queryStringParameters', {})
        offer_id = params.get('id')
        
        if offer_id:
            cursor.execute("UPDATE offers SET views_count = views_count + 1 WHERE id = %s", (offer_id,))
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'View counted'}),
                'isBase64Encoded': False
            }
    
    if method == 'DELETE':
        headers = event.get('headers', {})
        admin_auth = headers.get('X-Admin-Auth') or headers.get('x-admin-auth')
        
        if admin_auth != 'admin123':
            cursor.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        params = event.get('queryStringParameters', {})
        offer_id = params.get('id')
        
        cursor.execute("UPDATE offers SET is_active = false WHERE id = %s", (offer_id,))
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Offer deleted'}),
            'isBase64Encoded': False
        }
    
    cursor.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }