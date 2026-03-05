from django.urls import path
from . import views, views_excel, views_auth

urlpatterns = [
    path('', views.index_view, name='index'),
    path('api/assets/', views.list_create_assets, name='assets'),
    path('api/assets/<str:asset_id>/', views.delete_asset, name='delete_asset'),
    path('api/assets/<str:asset_id>/update/', views.update_asset, name='update_asset'),
    
    path('api/employees/', views.list_create_employees, name='employees'),
    path('api/employees/<str:emp_id>/', views.delete_employee, name='delete_employee'),
    
    path('api/assignments/', views.list_create_assignments, name='assignments'),
    path('api/assignments/<str:asg_id>/return/', views.return_assignment, name='return_assignment'),
    
    path('api/auth/login/', views_auth.login_view, name='login'),
    path('api/auth/logout/', views_auth.logout_view, name='logout'),
    path('api/auth/check/', views_auth.check_auth, name='check_auth'),
    path('api/users/', views_auth.list_create_users, name='users'),
    path('api/users/<str:user_id>/', views_auth.delete_user, name='delete_user'),
    path('api/groups/', views_auth.list_create_groups, name='groups'),
    path('api/groups/<str:group_id>/', views_auth.delete_group, name='delete_group'),
    
    path('api/export-excel/', views_excel.export_assets_excel, name='export_excel'),
    path('api/import-excel/', views_excel.import_assets_excel, name='import_excel'),
]
