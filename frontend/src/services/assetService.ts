import { apiClient } from '../api/client';
import { Asset, AssetCreate, AssetUpdate, AssetAssign } from '../types/asset';

export const assetService = {
  /**
   * Get all company assets (Admin / Manager)
   */
  async getAllAssets(): Promise<Asset[]> {
    const response = await apiClient.get<Asset[]>('/assets/');
    return response.data;
  },

  /**
   * Get assets assigned to current logged-in user
   */
  async getMyAssets(): Promise<Asset[]> {
    const response = await apiClient.get<Asset[]>('/assets/my');
    return response.data;
  },

  /**
   * Get a single asset by ID
   */
  async getAssetById(assetId: number | string): Promise<Asset> {
    const response = await apiClient.get<Asset>(`/assets/${assetId}`);
    return response.data;
  },

  /**
   * Create a new asset record
   */
  async createAsset(data: AssetCreate): Promise<Asset> {
    const response = await apiClient.post<Asset>('/assets/', data);
    return response.data;
  },

  /**
   * Update asset general details
   */
  async updateAsset(assetId: number | string, data: AssetUpdate): Promise<Asset> {
    const response = await apiClient.patch<Asset>(`/assets/${assetId}`, data);
    return response.data;
  },

  /**
   * Assign asset to an employee
   */
  async assignAsset(assetId: number | string, data: AssetAssign): Promise<Asset> {
    const response = await apiClient.patch<Asset>(`/assets/${assetId}/assign`, data);
    return response.data;
  },

  /**
   * Retire asset
   */
  async retireAsset(assetId: number | string): Promise<Asset> {
    const response = await apiClient.patch<Asset>(`/assets/${assetId}/retire`);
    return response.data;
  },
};