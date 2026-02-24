from django.urls import path
from . import views, views_excel

urlpatterns = [
    path('', views.index_view, name='index'),
    path('api/assets/', views.list_create_assets, name='assets'),
    path('api/assets/<str:asset_id>/', views.delete_asset, name='delete_asset'),
    path('api/employees/', views.list_create_employees, name='employees'),
    path('api/employees/<str:emp_id>/', views.delete_employee, name='delete_employee'),
    path('api/assignments/', views.list_create_assignments, name='assignments'),
    path('api/assignments/<str:asg_id>/return/', views.return_assignment, name='return_assignment'),
    path('api/export-excel/', views_excel.export_assets_excel, name='export_excel'),
    path('api/import-excel/', views_excel.import_assets_excel, name='import_excel'),
]
