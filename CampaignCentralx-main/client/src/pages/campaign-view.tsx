import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Download,
  Filter,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";
import SpreadsheetTable from "@/components/spreadsheet-table";
import type { Campaign, Contact } from "@shared/schema";

export default function CampaignView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    company: "all",
    title: "all",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLocation('/');
    }
  }, [setLocation]);

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['/api/campaigns', id],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch(`/api/campaigns/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          setLocation('/');
          throw new Error('Authentication failed');
        }
        if (response.status === 404) {
          throw new Error('Campaign not found');
        }
        throw new Error('Failed to fetch campaign');
      }
      return response.json();
    },
  });

  // Fetch campaign contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/campaigns', id, 'contacts', { search: searchQuery }],
    queryFn: async () => {
      const token = getAuthToken();
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
      });
      
      const response = await fetch(`/api/campaigns/${id}/contacts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setLocation('/');
          throw new Error('Authentication failed');
        }
        throw new Error('Failed to fetch contacts');
      }
      return response.json();
    },
    enabled: !!campaign,
  });

  const backToDashboard = () => {
    setLocation('/dashboard');
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setFilters({ company: "all", title: "all" });
    setSearchQuery("");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Campaign Not Found</h2>
          <p className="text-slate-600 mb-4">The campaign you're looking for doesn't exist.</p>
          <Button onClick={backToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={backToDashboard} className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="text-white h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">{campaign.name}</h1>
                  <p className="text-xs text-slate-600">
                    {campaign.recordCount.toLocaleString()} contacts • Last updated {formatDate(campaign.uploadDate)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search in campaign..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">Company:</label>
              <Select value={filters.company} onValueChange={(value) => setFilters(prev => ({ ...prev, company: value }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {/* Companies would be populated from actual data */}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">Title:</label>
              <Select value={filters.title} onValueChange={(value) => setFilters(prev => ({ ...prev, title: value }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Titles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Titles</SelectItem>
                  {/* Titles would be populated from actual data */}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="ghost" onClick={clearFilters} className="text-sm underline">
              Clear all filters
            </Button>
          </div>
        </div>
      )}

      {/* Spreadsheet Table */}
      <SpreadsheetTable
        contacts={contactsData?.contacts || []}
        loading={contactsLoading}
        pagination={undefined}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    </div>
  );
}
