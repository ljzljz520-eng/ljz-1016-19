"""
Global Error Handlers - 全局错误处理

接管 Django 默认的 400/403/404/500 HTML 错误页，
统一返回与 API 一致的 JSON 结构，避免将 Django 默认错误页暴露给用户。

注意：这些 handler 仅在 DEBUG=False 时由 Django 调用。
"""
import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def _error_json(code: int, message: str) -> JsonResponse:
    """构造与 api_response 一致的错误响应结构"""
    return JsonResponse({
        'success': False,
        'code': code,
        'message': message,
        'data': None,
    }, status=code)


def bad_request(request, exception=None):
    """400 - 请求错误"""
    return _error_json(400, '请求参数错误')


def permission_denied(request, exception=None):
    """403 - 禁止访问（含 CSRF 校验失败等情况）"""
    logger.warning(f"403 禁止访问: {request.method} {request.path}")
    return _error_json(403, '没有访问权限，请重新登录后再试')


def page_not_found(request, exception=None):
    """404 - 资源不存在"""
    return _error_json(404, '请求的资源不存在')


def server_error(request):
    """500 - 服务器内部错误"""
    logger.error(f"500 服务器内部错误: {request.method} {request.path}")
    return _error_json(500, '服务器开小差了，请稍后重试')
