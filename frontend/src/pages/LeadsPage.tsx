import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TableSortLabel,
  TextField,
  InputAdornment,
  Stack,
  useTheme,
  useMediaQuery,
  Divider,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Star as StarIcon,
  ArrowDropDown as ArrowDownIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { leadsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/layout/MainLayout';

interface Lead {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  rating: number;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_position: string | null;
  notes: string | null;
  tags: string[];
  estimated_value: number | null;
  probability: number;
  next_followup_date: string | null;
  contact_count: number;
  score: number;
  created_at: string;
}

interface LeadStats {
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  won_leads: number;
  lost_leads: number;
  total_value: number;
  pipeline_value: number;
  conversion_rate: number;
}

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadLeads();
    loadStats();
  }, [user, navigate, selectedStatus]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const statusFilter = selectedStatus === 'all' ? undefined : selectedStatus;
      const response = await leadsAPI.getLeads(statusFilter);
      setLeads(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await leadsAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, lead: Lead) => {
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLead(null);
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    
    try {
      await leadsAPI.deleteLead(selectedLead.id);
      setLeads(leads.filter(l => l.id !== selectedLead.id));
      handleMenuClose();
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete lead');
    }
  };

  const handleViewLead = () => {
    if (!selectedLead) return;
    navigate(`/leads/${selectedLead.id}`);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
      new: 'error',
      contacted: 'warning',
      qualified: 'info',
      proposal: 'info',
      negotiation: 'warning',
      won: 'success',
      lost: 'default'
    };
    return colors[status] || 'default';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: '🔥 Hot', color: '#ff5252' };
    if (score >= 50) return { label: '🌡️ Warm', color: '#ff9800' };
    return { label: '❄️ Cold', color: '#2196f3' };
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone?.includes(searchQuery)
  );

  // Zoho-style colors
  const zohoBlue = '#2563eb';
  const zohoOrange = '#f97316';
  const zohoGreen = '#10b981';
  const zohoRed = '#ef4444';
  const zohoGray = '#6b7280';
  const zohoLightGray = '#f3f4f6';

  if (!user) {
    return null;
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: number) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aValue = a[sortField as keyof Lead];
    let bValue = b[sortField as keyof Lead];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  return (
    <MainLayout>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#1e293b',
              fontSize: { xs: '1.5rem', md: '1.75rem' }
            }}
          >
            Active Leads
          </Typography>
          <IconButton size="small">
            <ArrowDownIcon />
          </IconButton>
        </Stack>
        
        {/* Alert Banner */}
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2, 
            bgcolor: '#fef3c7', 
            color: '#92400e',
            '& .MuiAlert-icon': { color: '#f59e0b' }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            ▲ Update Lead Details &gt;
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1
            }}
            onClick={() => navigate('/search')}
          >
            + New
          </Button>
          <IconButton>
            <MoreIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Box sx={{ minWidth: 120, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {stats.total_leads}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total Leads
              </Typography>
            </Box>
            <Box sx={{ minWidth: 120, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#10b981' }}>
                {stats.won_leads}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Won
              </Typography>
            </Box>
            <Box sx={{ minWidth: 120, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f59e0b' }}>
                ₹{Math.round(stats.pipeline_value / 1000)}K
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Pipeline Value
              </Typography>
            </Box>
            <Box sx={{ minWidth: 120, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                {stats.conversion_rate}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Win Rate
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && filteredLeads.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <TrendingUpIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="textSecondary">
            No leads yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Start adding facilities from your search results
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/search')}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Search Facilities
          </Button>
        </Box>
      )}

      {/* Leads Table */}
      {!loading && filteredLeads.length > 0 && (
        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    indeterminate={selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleSort('name')}
                    sx={{ fontWeight: 600 }}
                  >
                    NAME
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>COMPANY NAME</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>WORK PHONE</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SOURCE OF SUPPLY</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>PAYABLES (BCY)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>UNUSED CREDITS (BCY)</TableCell>
                <TableCell>
                  <IconButton size="small">
                    <SearchIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedLeads.map((lead) => {
                const scoreBadge = getScoreBadge(lead.score);
                const isSelected = selectedLeads.includes(lead.id);
                
                return (
                  <TableRow
                    key={lead.id}
                    hover
                    selected={isSelected}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f8fafc' },
                      '&.Mui-selected': { bgcolor: '#eff6ff' }
                    }}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectLead(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: scoreBadge.color,
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {lead.score}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {lead.name}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Chip
                              label={lead.status.toUpperCase()}
                              color={getStatusColor(lead.status)}
                              size="small"
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                            <Chip
                              label={scoreBadge.label}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.6rem',
                                bgcolor: scoreBadge.color,
                                color: 'white'
                              }}
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {lead.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {lead.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {lead.phone || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {lead.address ? lead.address.split(',')[lead.address.split(',').length - 1].trim() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ₹{lead.estimated_value ? lead.estimated_value.toLocaleString() : '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ₹{lead.contact_count * 1000 || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, lead);
                        }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewLead}>View Details</MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteLead} sx={{ color: '#ef4444' }}>
          Delete Lead
        </MenuItem>
      </Menu>
    </MainLayout>
  );
};

export default LeadsPage;

