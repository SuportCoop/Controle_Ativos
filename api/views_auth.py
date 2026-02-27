import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Group

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                groups = list(user.groups.values_list('name', flat=True))
                return JsonResponse({'success': True, 'username': user.username, 'groups': groups})
            else:
                return JsonResponse({'error': 'Credenciais inválidas'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método não permitido'}, status=405)

@csrf_exempt
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Método não permitido'}, status=405)

@csrf_exempt
def check_auth(request):
    if request.user.is_authenticated:
        groups = list(request.user.groups.values_list('name', flat=True))
        return JsonResponse({'authenticated': True, 'username': request.user.username, 'groups': groups})
    return JsonResponse({'authenticated': False})

@csrf_exempt
def list_create_users(request):
    if request.method == 'GET':
        users_data = []
        for u in User.objects.all():
            groups = list(u.groups.values_list('name', flat=True))
            users_data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'groups': groups,
                'is_active': u.is_active,
                'date_joined': u.date_joined.strftime("%d/%m/%Y")
            })
        return JsonResponse(users_data, safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            email = data.get('email', '')
            group_name = data.get('group')

            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Usuário já existe'}, status=400)

            user = User.objects.create_user(username=username, email=email, password=password)
            if group_name:
                try:
                    group = Group.objects.get(name=group_name)
                    user.groups.add(group)
                except Group.DoesNotExist:
                    pass
            
            groups = list(user.groups.values_list('name', flat=True))
            return JsonResponse({'success': True, 'id': user.id, 'username': user.username, 'groups': groups})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Método não permitido'}, status=405)

@csrf_exempt
def list_create_groups(request):
    if request.method == 'GET':
        groups_data = []
        for g in Group.objects.all():
            groups_data.append({
                'id': g.id,
                'name': g.name,
                'user_count': g.user_set.count()
            })
        return JsonResponse(groups_data, safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            if Group.objects.filter(name=name).exists():
                return JsonResponse({'error': 'Grupo já existe'}, status=400)

            group = Group.objects.create(name=name)
            return JsonResponse({'success': True, 'id': group.id, 'name': group.name})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Método não permitido'}, status=405)

@csrf_exempt
def delete_user(request, user_id):
    if request.method == 'DELETE':
        try:
            user = User.objects.get(id=user_id)
            if user.is_superuser:
                 return JsonResponse({'error': 'Não é possível excluir superusuário'}, status=403)
            user.delete()
            return JsonResponse({'success': True})
        except User.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_group(request, group_id):
    if request.method == 'DELETE':
        try:
            group = Group.objects.get(id=group_id)
            group.delete()
            return JsonResponse({'success': True})
        except Group.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'error': 'Method not allowed'}, status=405)
