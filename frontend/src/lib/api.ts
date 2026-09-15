import { ApiResponse, LoginResponse, LogoutResponse, DashboardStats, Server, Alert, Task, OperationLog } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// HTTP 状态码对应的友好提示（用于后端未返回统一 JSON 结构的兜底场景）
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '登录状态已失效，请重新登录',
  403: '没有访问权限，请重新登录后再试',
  404: '请求的资源不存在',
  405: '请求方法不允许',
  500: '服务器开小差了，请稍后重试',
  502: '服务暂时不可用，请稍后重试',
  503: '服务暂时不可用，请稍后重试',
};

function fallbackMessage(status: number): string {
  return HTTP_ERROR_MESSAGES[status] || '服务异常，请稍后重试';
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // 防御：后端若返回非 JSON（如 HTML 错误页），不直接暴露给用户，
      // 按 HTTP 状态码转换为统一结构和友好提示
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return {
          success: false,
          code: response.status,
          message: fallbackMessage(response.status),
          data: null as unknown as T,
        };
      }

      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        code: 500,
        message: '网络请求失败，请检查网络连接',
        data: null as unknown as T,
      };
    }
  }

  // 登录
  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // 登出
  async logout(): Promise<ApiResponse<LogoutResponse>> {
    return this.request<LogoutResponse>('/auth/logout/', {
      method: 'POST',
    });
  }

  // 获取当前用户信息
  async getUserInfo(): Promise<ApiResponse<any>> {
    return this.request<any>('/auth/user/');
  }

  // 获取仪表板统计
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboard/stats/');
  }

  // 获取服务器列表
  async getServers(): Promise<ApiResponse<Server[]>> {
    return this.request<Server[]>('/servers/');
  }

  // 获取告警列表
  async getAlerts(status?: string, level?: string): Promise<ApiResponse<Alert[]>> {
    let endpoint = '/alerts/';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (level) params.append('level', level);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request<Alert[]>(endpoint);
  }

  // 获取任务列表
  async getTasks(status?: string, priority?: string): Promise<ApiResponse<Task[]>> {
    let endpoint = '/tasks/';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request<Task[]>(endpoint);
  }

  // 获取操作日志
  async getOperationLogs(): Promise<ApiResponse<OperationLog[]>> {
    return this.request<OperationLog[]>('/logs/');
  }
}

export const api = new ApiClient(API_BASE_URL);
