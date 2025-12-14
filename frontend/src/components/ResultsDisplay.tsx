import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Rating,
  Link,
  Grid,
  Paper,
  Button,
  IconButton,
  Snackbar,
  Alert,
  CardActions
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { LocationOn, Star, Language } from '@mui/icons-material';
import Phone from '@mui/icons-material/Phone';
import { leadsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Facility {
  name: string;
  address: string;
  location: string;
  google_rating: number;
  website?: string;
  place_id: string;
}

interface SearchResult {
  facilities: Facility[];
  total_found: number;
  search_query: any;
  timestamp: number;
  success: boolean;
  error_message?: string;
}

interface ResultsDisplayProps {
  results: SearchResult | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const { user } = useAuth();
  const [addedLeads, setAddedLeads] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  if (!results) {
    return null;
  }
  
  const handleAddToLeads = async (facility: Facility) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Please login to add leads',
        severity: 'error'
      });
      return;
    }
    
    try {
      await leadsAPI.createLead({
        name: facility.name,
        phone: (facility as any).international_phone_number || (facility as any).formatted_phone_number,
        email: (facility as any).email,
        address: facility.address,
        website: facility.website,
        rating: facility.google_rating,
        notes: `Added from search: ${facility.location}`
      });
      
      setAddedLeads(prev => new Set(prev).add(facility.place_id));
      setSnackbar({
        open: true,
        message: `${facility.name} added to leads!`,
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to add lead',
        severity: 'error'
      });
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!results.success || results.facilities.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No facilities found
        </Typography>
        {results.error_message && (
          <Typography variant="body2" color="error" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
            {results.error_message}
          </Typography>
        )}
        {!results.error_message && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Try adjusting your search criteria or use a different location.
          </Typography>
        )}
      </Paper>
    );
  }

  const selectedFields: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('selected_fields') || '[]');
    } catch {
      return [];
    }
  })();

  const csv = () => {
    const rows = results.facilities.map((f) => {
      const record: Record<string, any> = {};
      const add = (k: string, v: any) => { record[k] = v ?? ''; };
      const map: Record<string, any> = {
        name: f.name,
        international_phone_number: (f as any).international_phone_number,
        contact_number: (f as any).formatted_phone_number,
        email: (f as any).email,
        location: f.location,
        address: f.address,
        google_rating: f.google_rating,
        user_ratings_total: (f as any).user_ratings_total,
        business_status: (f as any).business_status,
        website: f.website,
        established_year: (f as any).established_year,
        whatsapp_number: (f as any).whatsapp_number,
        instagram_id: (f as any).instagram_id,
        linkedin: (f as any).linkedin,
        place_id: f.place_id,
      };
      const priority = ['name','international_phone_number','contact_number','email','location','address'];
      const selected = (selectedFields.length ? selectedFields : ['name','international_phone_number','formatted_phone_number','email','location','address','google_rating','user_ratings_total','website']);
      const keys = Array.from(new Set([...priority, ...selected]));
      keys.forEach((k) => add(k, map[k]));
      return record;
    });

    const keys = Object.keys(rows[0] || {});
    const lines = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(String(r[k] ?? '')).replace(/^"|"$/g, '"')).join(','))];
    return lines.join('\n');
  };

  const download = () => {
    const blob = new Blob([csv()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const q = results.search_query as any;
    const safe = (s: string) => (s || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
    a.href = url;
    a.download = `${safe(q?.place_type)}_${safe(q?.country)}_${safe(q?.city)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Search Results ({results.total_found} found)
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={download}>
          Download CSV
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        {results.facilities.map((facility, index) => (
          <Grid item xs={12} sm={6} md={4} key={facility.place_id || index}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {facility.name}
                </Typography>
                
                {((facility as any).international_phone_number || (facility as any).formatted_phone_number) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone color="action" sx={{ mr: 0.5, fontSize: 16 }} />
                    <Typography variant="body2" color="textSecondary">
                      {(facility as any).international_phone_number || (facility as any).formatted_phone_number}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn color="action" sx={{ mr: 0.5, fontSize: 16 }} />
                  <Typography variant="body2" color="textSecondary">
                    {facility.address}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Star color="warning" sx={{ mr: 0.5, fontSize: 16 }} />
                  <Rating
                    value={facility.google_rating}
                    precision={0.1}
                    size="small"
                    readOnly
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {facility.google_rating}
                  </Typography>
                </Box>

                {facility.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Language color="action" sx={{ mr: 0.5, fontSize: 16 }} />
                    <Link
                      href={facility.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                    >
                      Visit Website
                    </Link>
                  </Box>
                )}

                <Chip
                  label={facility.location}
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </CardContent>
              
              {user && (
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant={addedLeads.has(facility.place_id) ? "outlined" : "contained"}
                    color={addedLeads.has(facility.place_id) ? "success" : "primary"}
                    startIcon={addedLeads.has(facility.place_id) ? <CheckCircleIcon /> : <AddCircleOutlineIcon />}
                    onClick={() => handleAddToLeads(facility)}
                    disabled={addedLeads.has(facility.place_id)}
                    fullWidth
                    size="small"
                  >
                    {addedLeads.has(facility.place_id) ? 'Added to Leads' : 'Add to Leads'}
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ResultsDisplay;
