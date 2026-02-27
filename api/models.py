from django.db import models
import uuid
from django.utils import timezone

class Asset(models.Model):
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, default="Não informada")
    delivery_date = models.DateField(null=True, blank=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Específicos para Computador/Notebook
    processor = models.CharField(max_length=100, blank=True, null=True)
    ram_memory = models.CharField(max_length=50, blank=True, null=True)
    storage = models.CharField(max_length=50, blank=True, null=True)
    
    # Específicos para Celular/Tablet
    imei = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Adicionais Recentes
    brand = models.CharField(max_length=100, blank=True, null=True)
    condition = models.CharField(max_length=20, default='Usado')
    entry_date = models.DateField(blank=True, null=True)
    
    # Universal
    observation = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            import time
            import random
            self.id = f"asset-{int(time.time() * 1000)}{random.randint(0, 999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Employee(models.Model):
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=100, default='Sem Setor')
    matricula = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            import time
            self.id = f"emp-{int(time.time() * 1000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Assignment(models.Model):
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='assignments')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assignments')
    date = models.DateTimeField(default=timezone.now)
    return_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='active') # active / returned
    signed_term = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.id:
            import time
            self.id = f"asg-{int(time.time() * 1000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.asset.name} -> {self.employee.name} ({self.status})"

class SystemUser(models.Model):
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100) # In production use hashed passwords
    role = models.CharField(max_length=50)

    def save(self, *args, **kwargs):
        if not self.id:
            import time
            self.id = f"usr-{int(time.time() * 1000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.role}"
