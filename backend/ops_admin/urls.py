"""
URL configuration for ops_admin project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# 全局错误处理：以统一 JSON 结构替代 Django 默认 HTML 错误页（DEBUG=False 时生效）
handler400 = 'api.error_handlers.bad_request'
handler403 = 'api.error_handlers.permission_denied'
handler404 = 'api.error_handlers.page_not_found'
handler500 = 'api.error_handlers.server_error'
