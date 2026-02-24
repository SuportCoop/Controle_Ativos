from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
import json
from .models import Asset, Employee, Assignment
from django.utils import timezone

def index_view(request):
    return render(request, 'index.html')

# --- Assets API ---
@csrf_exempt
def list_create_assets(request):
    if request.method == 'GET':
        assets = Asset.objects.all().values('id', 'name', 'category', 'created_at')
        return JsonResponse(list(assets), safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        asset = Asset.objects.create(name=data['name'], category=data['category'])
        return JsonResponse({'id': asset.id, 'name': asset.name, 'category': asset.category})
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
        emps = Employee.objects.all().values('id', 'name', 'role')
        return JsonResponse(list(emps), safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        emp = Employee.objects.create(name=data['name'], role=data.get('role', 'Sem Setor'))
        return JsonResponse({'id': emp.id, 'name': emp.name, 'role': emp.role})
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
        asgs = Assignment.objects.all().values('id', 'asset_id', 'employee_id', 'date', 'return_date', 'status')
        return JsonResponse(list(asgs), safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        try:
            asset = Asset.objects.get(id=data['assetId'])
            employee = Employee.objects.get(id=data['employeeId'])
            asg = Assignment.objects.create(asset=asset, employee=employee)
            return JsonResponse({
                'id': asg.id, 'assetId': asg.asset.id, 'employeeId': asg.employee.id, 
                'date': asg.date, 'status': asg.status
            })
        except (Asset.DoesNotExist, Employee.DoesNotExist):
            return JsonResponse({'error': 'Invalid asset or employee'}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def return_assignment(request, asg_id):
    if request.method == 'POST':
        try:
            asg = Assignment.objects.get(id=asg_id)
            asg.status = 'returned'
            asg.return_date = timezone.now()
            asg.save()
            return JsonResponse({'success': True})
        except Assignment.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'error': 'Method not allowed'}, status=405)
