const API_BASE_URL = "http://192.168.1.100:3003/api";

export interface ScreenDataItem {
  queueNumber: string;
  displayNumber: string;
  stationName: string;
  calledAt: string;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private async fetchData<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطأ في الطلب");
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      };
    }
  }

  async getScreenDataCalled(): Promise<
    ApiResponse<{ display: ScreenDataItem[] }>
  > {
    return this.fetchData("/display/screen-data-called");
  }

  async getScreenData(): Promise<ApiResponse<{ display: ScreenDataItem[] }>> {
    return this.fetchData("/display/screen-data");
  }

  async getRecentCalls(
    limit: number = 10
  ): Promise<ApiResponse<{ calls: ScreenDataItem[] }>> {
    return this.fetchData(`/display/recent-calls?limit=${limit}`);
  }
}

export const apiService = new ApiService();
