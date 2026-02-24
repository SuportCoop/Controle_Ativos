from django.db import models
import uuid
from django.utils import timezone

class Asset(models.Model):
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

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

    def save(self, *args, **kwargs):
        if not self.id:
            import time
            self.id = f"asg-{int(time.time() * 1000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.asset.name} -> {self.employee.name} ({self.status})"
