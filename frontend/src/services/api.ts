import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
});

// Attach auth token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Token helpers ────────────────────────────────────────────────────────────
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}

export function getStoredToken(): string | null {
  return localStorage.getItem('auth_token');
}

// ─── Data types ───────────────────────────────────────────────────────────────

export interface VacancyRate {
  id: number;
  year: number;
  geography: string;
  bedroomType: string;
  vacancyRate: number;
  universe: number;
}

export interface RentalPrice {
  id: number;
  year: number;
  geography: string;
  bedroomType: string;
  averageRent: number;
  percentageChange: number;
}

export interface HousingStart {
  year: number;
  Single: number;
  'Semi-Detached': number;
  Row: number;
  Apartment: number;
  [key: string]: number;
}

export interface HomePrice {
  year: number;
  quarter?: string;
  detached: number;
  semiDetached: number;
  townhouse: number;
  condo: number;
  [key: string]: number | string | undefined;
}

export interface MortgageRate {
  year: number;
  fixed5yr: number;
  variable: number;
  policyRate: number;
}

export interface PopulationData {
  year: number;
  region: string;
  population: number;
  growth: number;
}

export interface ImmigrationData {
  year: number;
  newPermanentResidents: number;
  region?: string;
}

export interface DataSource {
  id: number;
  key: string;
  name: string;
  description: string;
  url: string;
  lastSyncedAt: string | null;
  lastSyncStatus: 'pending' | 'success' | 'failed' | 'manual';
  errorMessage: string | null;
  updatedAt: string;
}

export interface KpiData {
  vacancyRate: number;
  avgRent2Bed: number;
  rentChange: number;
  mortgageRate5yr: number;
  policyRate: number;
  avgDetachedPrice: number;
  population: number;
  populationGrowth: number;
  newPermanentResidents: number;
  year: number;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function getKpis(): Promise<KpiData> {
  const { data } = await api.get<KpiData>('/overview/kpis');
  return data;
}

// ─── Rental market ────────────────────────────────────────────────────────────

export async function getVacancyRates(params?: {
  geography?: string;
  bedroomType?: string;
}): Promise<VacancyRate[]> {
  const { data } = await api.get<VacancyRate[]>('/vacancy-rates', { params });
  return data;
}

export async function getRentalPrices(params?: {
  geography?: string;
  bedroomType?: string;
}): Promise<RentalPrice[]> {
  const { data } = await api.get<RentalPrice[]>('/rental-prices', { params });
  return data;
}

export async function getHousingStartsAnnual(geography?: string): Promise<HousingStart[]> {
  const { data } = await api.get<HousingStart[]>('/housing-starts/annual', {
    params: geography ? { geography } : undefined,
  });
  return data;
}

// ─── Market ───────────────────────────────────────────────────────────────────

export async function getHomePrices(): Promise<HomePrice[]> {
  const { data } = await api.get<HomePrice[]>('/market/home-prices');
  return data;
}

export async function getMortgageRates(): Promise<MortgageRate[]> {
  const { data } = await api.get<MortgageRate[]>('/market/mortgage-rates');
  return data;
}

export async function getPopulation(region?: string): Promise<PopulationData[]> {
  const { data } = await api.get<PopulationData[]>('/market/population', {
    params: region ? { region } : undefined,
  });
  return data;
}

export async function getImmigration(): Promise<ImmigrationData[]> {
  const { data } = await api.get<ImmigrationData[]>('/market/immigration');
  return data;
}

// ─── Data sources ─────────────────────────────────────────────────────────────

export async function getDataSources(): Promise<DataSource[]> {
  const { data } = await api.get<DataSource[]>('/data-sources');
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(payload: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function getProfile(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}
