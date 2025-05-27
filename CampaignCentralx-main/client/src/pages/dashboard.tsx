import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartLine,
  Plus,
  LogOut,
  FileText,
  Users,
  Calendar,
  Database,
  Search,
  Download,
  Trash2,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken, clearAuthToken } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import UploadModal from "@/components/upload-modal";
import type { Campaign } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLocation('/');
    }
  }, [setLocation]);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['/api/campaigns'],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          clearAuthToken();
          setLocation('/');
          throw new Error('Authentication failed');
        }
        throw new Error('Failed to fetch campaigns');
      }
      return response.json();
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const token = getAuthToken();
      await apiRequest('DELETE', `/api/campaigns/${campaignId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive"
      });
    },
  });

  const handleLogout = () => {
    clearAuthToken();
    setLocation('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const openCampaign = (campaignId: number) => {
    setLocation(`/campaign/${campaignId}`);
  };

  const handleDeleteCampaign = (e: React.MouseEvent, campaignId: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    .filter((campaign: Campaign) =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: Campaign, b: Campaign) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'size':
          return b.fileSize - a.fileSize;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Calculate stats
  const totalCampaigns = campaigns.length;
  const totalContacts = campaigns.reduce((sum: number, campaign: Campaign) => sum + campaign.recordCount, 0);
  const totalStorage = campaigns.reduce((sum: number, campaign: Campaign) => sum + campaign.fileSize, 0);
  const lastUpload = campaigns.length > 0 ? 
    Math.max(...campaigns.map((c: Campaign) => new Date(c.uploadDate).getTime())) : null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysAgo = (date: string) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - uploadDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="text-white h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Campaign Manager</h1>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                Dashboard
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowUploadModal(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Upload Campaign</span>
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="p-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Campaign Overview</h2>
          <p className="text-slate-600">Manage and analyze your campaign data files</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-slate-900">{totalCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="text-emerald-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-slate-900">{totalContacts.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-purple-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">Last Upload</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {lastUpload ? getDaysAgo(new Date(lastUpload).toString()) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Database className="text-amber-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">Storage Used</p>
                  <p className="text-2xl font-bold text-slate-900">{formatBytes(totalStorage)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">Your Campaigns</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="size">Sort by Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-slate-200">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-slate-600 mt-2">Loading campaigns...</p>
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-900 mb-2">No campaigns found</h4>
                  <p className="text-slate-600 mb-4">
                    {searchQuery ? 'No campaigns match your search.' : 'Upload your first campaign to get started.'}
                  </p>
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Campaign
                  </Button>
                </div>
              ) : (
                filteredCampaigns.map((campaign: Campaign) => (
                  <div
                    key={campaign.id}
                    className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => openCampaign(campaign.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <FileText className="text-white h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-slate-900">{campaign.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                            <span>{campaign.recordCount.toLocaleString()} contacts</span>
                            <span>•</span>
                            <span>Uploaded {formatDate(campaign.uploadDate.toString())}</span>
                            <span>•</span>
                            <span>{formatBytes(campaign.fileSize)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={campaign.status === 'active' ? 'default' : 'secondary'}
                          className={campaign.status === 'active' ? 'bg-emerald-100 text-emerald-800' : ''}
                        >
                          {campaign.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteCampaign(e, campaign.id)}
                          className="text-slate-400 hover:text-red-600"
                          disabled={deleteCampaignMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="text-slate-400 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Upload Modal */}
      <UploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal}
        onSuccess={() => {
          setShowUploadModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
        }}
      />
    </div>
  );
}
