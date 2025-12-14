import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  LinearProgress
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { facilitiesAPI } from '../services/api';
import { Country, State as CState, City as CCity, ICountry, IState, ICity } from 'country-state-city';
import { FACILITY_TAXONOMY as FACILITY_CATEGORIES, DEFAULT_CATEGORY, DEFAULT_TYPE } from '../data/facility_taxonomy';
import { 
  FormContainer, 
  FormTextField, 
  FormSelect, 
  FormButton 
} from './forms';
// Generic hooks and utilities available for future use
// import { useForm, useLocalStorage, useDebounce } from '../hooks';
// import { validateApiKey } from '../utils';

// Filtered list of developed and developing countries
// This reduces the country dropdown to show only major developed and developing nations
// To use ALL countries, change SHOW_ALL_COUNTRIES to true in the getCountries() function below
const DEVELOPED_AND_DEVELOPING_COUNTRIES = [
  // Major Developed Countries
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Luxembourg', 'Iceland', 'New Zealand', 'Australia', 'Japan', 'South Korea', 'Singapore', 'Israel', 'Hong Kong', 'Taiwan',
  
  // Major Developing Countries
  'India', 'China', 'Brazil', 'Russia', 'Mexico', 'Indonesia', 'Turkey', 'South Africa', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Thailand', 'Malaysia', 'Philippines', 'Vietnam', 'Egypt', 'Nigeria', 'Kenya', 'Morocco', 'Algeria', 'Tunisia', 'Ghana', 'Ethiopia', 'Tanzania', 'Uganda', 'Bangladesh', 'Pakistan', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia', 'Laos', 'Mongolia', 'Kazakhstan', 'Uzbekistan', 'Ukraine', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovenia', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania', 'Portugal', 'Greece', 'Cyprus', 'Malta',
  
  // Middle East Countries
  'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Iran', 'Yemen', 'Palestine', 'Afghanistan',
  
  // Additional Asia Countries (Central Asia, South Asia, Southeast Asia, East Asia)
  'Bhutan', 'Brunei', 'East Timor', 'Maldives', 'North Korea', 'Macau', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Azerbaijan', 'Armenia', 'Georgia'
];

// Get filtered countries
const getFilteredCountries = () => {
  const allCountries = Country.getAllCountries();
  return allCountries.filter((country: ICountry) => 
    DEVELOPED_AND_DEVELOPING_COUNTRIES.includes(country.name)
  );
};

// Utility function to get countries (easily switch between filtered and all)
const getCountries = () => {
  // Set to true to show ALL countries, false to show only developed/developing
  const SHOW_ALL_COUNTRIES = false;
  
  return SHOW_ALL_COUNTRIES ? Country.getAllCountries() : getFilteredCountries();
};

interface SearchFormProps {
  onSearch: (results: any) => void;
}


const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [apiKey, setApiKey] = useState(() => {
    // Load API key from localStorage (browser storage only, not database)
    return localStorage.getItem('google_api_key') || '';
  });
  const [country, setCountry] = useState('India');
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState('Mumbai');
  const [facilityCategory, setFacilityCategory] = useState<string>(DEFAULT_CATEGORY);
  const [placeType, setPlaceType] = useState<string>(DEFAULT_TYPE);
  const [maxResults, setMaxResults] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);


  // Load last searched parameters and search history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('last_search');
      if (!raw) return;
      const data = JSON.parse(raw) as {
        country?: string;
        state?: string;
        city?: string;
        facility_category?: string;
        place_type?: string;
        max_results?: number;
      };
      if (data.country) setCountry(data.country);
      if (typeof data.state === 'string') setState(data.state);
      if (data.city) setCity(data.city);
      if (data.facility_category) setFacilityCategory(data.facility_category);
      if (data.place_type) setPlaceType(data.place_type);
      if (data.max_results) setMaxResults(Number(data.max_results));
    } catch {}
    
  }, [user, token]);

  // Listen for custom event from Header to populate form
  useEffect(() => {
    const handlePopulateForm = (event: CustomEvent) => {
      const { country, city, placeType, maxResults } = event.detail;
      setCountry(country);
      setState(''); // Reset state as it's not stored in history
      setCity(city);
      setPlaceType(placeType);
      setMaxResults(maxResults);
      
      // Try to find the category from the place type
      const category = 'Fitness';
      if (category) {
        setFacilityCategory(category);
      }
    };

    window.addEventListener('populateSearchForm', handlePopulateForm as EventListener);
    return () => {
      window.removeEventListener('populateSearchForm', handlePopulateForm as EventListener);
    };
  }, []);


  const handleSearch = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Google Places API key');
      return;
    }

    // Debug authentication state
    console.log('Search request - User authenticated:', !!user, 'Token present:', !!token);

    // Clear previous results in UI immediately
    try { (onSearch as any)(null); } catch {}

    setIsLoading(true);
    setError('');

    try {
      const searchData = {
        api_key: apiKey,
        country: country,
        state: state,
        city: city,
        place_type: placeType,
        facility_category: facilityCategory,
        max_results: maxResults
      };

      // Persist last search params (excluding API key)
      localStorage.setItem('last_search', JSON.stringify({
        country,
        state,
        city,
        facility_category: facilityCategory,
        place_type: placeType,
        max_results: maxResults,
      }));

      const response = await facilitiesAPI.search(searchData);
      onSearch(response.data);
      
      // Dispatch event to refresh search history in Header component
      if (user && token) {
        const event = new CustomEvent('searchCompleted');
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('Please register or login to search. Redirecting to registration...');
        setTimeout(() => navigate('/register'), 800);
      } else {
        // Show detailed error from backend if available
        const backendError = err?.response?.data?.detail;
        
        // Check for network/CORS errors
        if (!err.response && err.request) {
          const apiConfig = (window as any).__APP_CONFIG__?.apiUrl || process.env.REACT_APP_API_URL || 'http://localhost:8000';
          
          // More detailed error message
          let errorMsg = `Network error. Cannot connect to backend API at ${apiConfig}.\n\n`;
          
          if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
            errorMsg += '❌ Connection refused. The backend server might not be running.\n';
            errorMsg += '   Please check: python start_backend.py';
          } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
            errorMsg += '❌ Network error. Possible causes:\n';
            errorMsg += '   1. Backend server is not running\n';
            errorMsg += '   2. CORS configuration issue\n';
            errorMsg += '   3. Firewall blocking the connection\n';
            errorMsg += `   4. Wrong API URL (current: ${apiConfig})`;
          } else if (err.message?.includes('timeout')) {
            errorMsg += '❌ Request timeout. The backend might be slow or unresponsive.';
          } else {
            errorMsg += '❌ Unknown network error. Check browser console for details.';
          }
          
          setError(errorMsg);
          console.error('🔴 Network error details:', {
            message: err.message,
            code: err.code,
            apiUrl: apiConfig,
            currentOrigin: window.location.origin,
            request: err.request,
            stack: err.stack,
          });
        } else {
          const displayError = backendError || err.message || 'Search failed';
          setError(displayError);
          console.error('Search error:', err);
          console.error('Backend response:', err?.response?.data);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer title="Find Facilities">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* API Key Section */}
        <Box sx={{ width: '100%' }}>
          <FormTextField
            label="Google Places API Key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              const newKey = e.target.value;
              setApiKey(newKey);
              // Save to localStorage (browser only, NOT database)
              localStorage.setItem('google_api_key', newKey);
            }}
            placeholder="AIza..."
            helperText="Enter your Google Places API key (saved in browser only)"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="toggle api key visibility" onClick={() => setShowApiKey(v => !v)} edge="end">
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Location Section */}
        <Box sx={{ width: '100%' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 3 }} sx={{ alignItems: { xs: 'stretch', md: 'flex-start' } }}>
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 200 } }}>
              <FormSelect
                label="Country"
                value={country}
                onChange={(val) => {
                  setCountry(val);
                  setState('');
                  setCity('');
                }}
                options={getCountries().map((c: ICountry) => ({
                  value: c.name,
                  label: c.name
                }))}
                placeholder="Select Country"
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 200 } }}>
              <FormSelect
                label="State / Province"
                value={state}
                onChange={(val) => {
                  setState(val);
                  setCity('');
                }}
                options={(country ? CState.getStatesOfCountry((getCountries().find((c: ICountry) => c.name === country)?.isoCode || '')) : []).map((s: IState) => ({
                  value: s.name,
                  label: s.name
                }))}
                placeholder="Select State"
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 200 } }}>
              <FormSelect
                label="City / Area"
                value={city}
                onChange={setCity}
                options={(country && state ? CCity.getCitiesOfState(
                  (getCountries().find((c: ICountry) => c.name === country)?.isoCode || ''),
                  (CState.getStatesOfCountry((getCountries().find((c: ICountry) => c.name === country)?.isoCode || '')).find((s: IState) => s.name === state)?.isoCode || '')
                ) : []).map((c: ICity) => ({
                  value: c.name,
                  label: c.name
                }))}
                placeholder="Select City"
                fullWidth
              />
            </Box>
          </Stack>
        </Box>

        {/* Facility Section */}
        <Box sx={{ width: '100%' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 3 }} sx={{ alignItems: { xs: 'stretch', md: 'flex-start' } }}>
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 180 } }}>
              <FormSelect
                label="Facility Category"
                value={facilityCategory}
                onChange={(cat) => {
                  setFacilityCategory(cat);
                  // Set first type from the selected category
                  const typesForCategory = FACILITY_CATEGORIES[cat] || [];
                  if (typesForCategory.length > 0) {
                    setPlaceType(typesForCategory[0]);
                  }
                }}
                options={Object.keys(FACILITY_CATEGORIES).map(cat => ({
                  value: cat,
                  label: cat
                }))}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 180 } }}>
              <FormSelect
                label="Facility Type"
                value={placeType}
                onChange={setPlaceType}
                options={(FACILITY_CATEGORIES[facilityCategory] || []).map(type => ({
                  value: type,
                  label: type
                }))}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 180 } }}>
              <FormTextField
                label="Max Results"
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                inputProps={{ min: 1, max: 50 }}
                fullWidth
              />
            </Box>
          </Stack>
        </Box>

        {/* Loading indicator */}
        {isLoading && (
          <Box sx={{ width: '100%', mt: 1 }}>
            <LinearProgress 
              sx={{ 
                height: 4,
                borderRadius: 2,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2
                }
              }} 
            />
          </Box>
        )}

        {/* Search Button */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <FormButton
            onClick={handleSearch}
            disabled={isLoading}
            position="right"
          >
            {isLoading ? 'Searching...' : 'Search Facilities'}
          </FormButton>
        </Box>
      </Box>
    </FormContainer>
  );
};

export default SearchForm;