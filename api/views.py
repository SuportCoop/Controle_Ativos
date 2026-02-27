from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
import json
from .models import Asset, Employee, Assignment, SystemUser
from django.utils import timezone

def index_view(request):
    return render(request, 'index.html')

# --- Assets API ---
@csrf_exempt
def list_create_assets(request):
    if request.method == 'GET':
        fields = ['id', 'name', 'category', 'created_at', 'processor', 'ram_memory', 'storage', 'imei', 'phone_number', 'observation', 'brand', 'condition', 'entry_date']
        assets = Asset.objects.all().values(*fields)
        return JsonResponse(list(assets), safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        
        # Trata data de entrada nula/vazia
        entry_date = data.get('entry_date')
        if not entry_date:
            entry_date = None
            
        asset = Asset.objects.create(
            name=data['name'], 
            category=data['category'],
            processor=data.get('processor', ''),
            ram_memory=data.get('ram_memory', ''),
            storage=data.get('storage', ''),
            imei=data.get('imei', ''),
            phone_number=data.get('phone_number', ''),
            observation=data.get('observation', ''),
            brand=data.get('brand', ''),
            condition=data.get('condition', 'Usado'),
            entry_date=entry_date
        )
        return JsonResponse({
            'id': asset.id, 'name': asset.name, 'category': asset.category,
            'processor': asset.processor, 'ram_memory': asset.ram_memory, 'storage': asset.storage,
            'imei': asset.imei, 'phone_number': asset.phone_number, 'observation': asset.observation,
            'brand': asset.brand, 'condition': asset.condition, 'entry_date': asset.entry_date
        })
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_asset(request, asset_id):
    if request.method in ['PUT', 'PATCH']:
        try:
            asset = Asset.objects.get(id=asset_id)
            data = json.loads(request.body)
            
            asset.name = data.get('name', asset.name)
            asset.category = data.get('category', asset.category)
            asset.brand = data.get('brand', asset.brand)
            asset.condition = data.get('condition', asset.condition)
            
            entry_date = data.get('entry_date')
            if entry_date == '':
                asset.entry_date = None
            elif entry_date is not None:
                asset.entry_date = entry_date
                
            asset.processor = data.get('processor', asset.processor)
            asset.ram_memory = data.get('ram_memory', asset.ram_memory)
            asset.storage = data.get('storage', asset.storage)
            asset.imei = data.get('imei', asset.imei)
            asset.phone_number = data.get('phone_number', asset.phone_number)
            asset.observation = data.get('observation', asset.observation)
            
            asset.save()
            return JsonResponse({'success': True})
        except Asset.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_asset(request, asset_id):
    if request.method == 'DELETE':
        try:
            asset = Asset.objects.get(id=asset_id)
            if asset.assignments.filter(status='active').exists():
                return JsonResponse({'error': 'Asset in use'}, status=400)
            asset.delete()
            return JsonResponse({'success': True})
        except Asset.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- Employees API ---
@csrf_exempt
def list_create_employees(request):
    if request.method == 'GET':
        emps = Employee.objects.all().values('id', 'name', 'role', 'matricula', 'department')
        return JsonResponse(list(emps), safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        emp = Employee.objects.create(
            name=data['name'], 
            role=data.get('role', 'Sem Setor'),
            matricula=data.get('matricula', ''),
            department=data.get('department', '')
        )
        return JsonResponse({
            'id': emp.id, 'name': emp.name, 'role': emp.role, 
            'matricula': emp.matricula, 'department': emp.department
        })
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_employee(request, emp_id):
    if request.method == 'DELETE':
        try:
            emp = Employee.objects.get(id=emp_id)
            if emp.assignments.filter(status='active').exists():
                return JsonResponse({'error': 'Employee has active assets'}, status=400)
            emp.delete()
            return JsonResponse({'success': True})
        except Employee.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- Assignments API ---
@csrf_exempt
def list_create_assignments(request):
    if request.method == 'GET':
        asgs = Assignment.objects.all().values('id', 'asset_id', 'employee_id', 'date', 'return_date', 'status', 'signed_term')
        return JsonResponse(list(asgs), safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        try:
            asset = Asset.objects.get(id=data['assetId'])
            employee = Employee.objects.get(id=data['employeeId'])
            signed = data.get('signedTerm', False)
            asg = Assignment.objects.create(asset=asset, employee=employee, signed_term=signed)
            return JsonResponse({
                'id': asg.id, 'assetId': asg.asset.id, 'employeeId': asg.employee.id, 
                'date': asg.date, 'status': asg.status, 'signedTerm': asg.signed_term
            })
        except (Asset.DoesNotExist, Employee.DoesNotExist):
            return JsonResponse({'error': 'Invalid asset or employee'}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def return_assignment(request, asg_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body) if request.body else {}
        except:
            data = {}
            
        try:
            asg = Assignment.objects.get(id=asg_id)
            asg.status = 'returned'
            
            custom_date = data.get('return_date')
            if custom_date:
                asg.return_date = custom_date
            else:
                asg.return_date = timezone.now()
                
            asg.save()
            return JsonResponse({'success': True})
        except Assignment.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- System Users API ---
@csrf_exempt
def list_create_system_users(request):
    if request.method == 'GET':
        users = SystemUser.objects.all().values('id', 'name', 'email', 'role')
        return JsonResponse(list(users), safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        user = SystemUser.objects.create(
            name=data.get('name', ''), 
            email=data.get('email', ''),
            password=data.get('password', ''),
            role=data.get('role', 'Leitor')
        )
        return JsonResponse({
            'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role
        })
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_system_user(request, user_id):
    if request.method == 'DELETE':
        try:
            user = SystemUser.objects.get(id=user_id)
            user.delete()
            return JsonResponse({'success': True})
        except SystemUser.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'error': 'Method not allowed'}, status=405)
