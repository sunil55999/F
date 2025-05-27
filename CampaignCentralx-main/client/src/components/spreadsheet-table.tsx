import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ExternalLink,
  Users,
  Copy,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@shared/schema";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SpreadsheetTableProps {
  contacts: Contact[];
  loading: boolean;
  pagination?: PaginationData;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: string) => void;
}

export default function SpreadsheetTable({
  contacts,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange
}: SpreadsheetTableProps) {
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(contacts.map(contact => contact.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleSelectContact = (contactId: number, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const copyToClipboard = async () => {
    try {
      // Create header row
      const headers = [
        'First Name', 'Last Name', 'Title', 'Company', 'Email', 
        'Mobile Phone', 'Other Phone', 'Corporate Phone', 
        'Person LinkedIn', 'Company LinkedIn', 'Website'
      ];
      
      // Create data rows
      const rows = contacts.map(contact => [
        contact.firstName || '',
        contact.lastName || '',
        contact.title || '',
        contact.company || '',
        contact.email || '',
        contact.mobilePhone || '',
        contact.otherPhone || '',
        contact.corporatePhone || '',
        contact.personLinkedinUrl || '',
        contact.companyLinkedinUrl || '',
        contact.website || ''
      ]);
      
      // Combine header and data
      const allRows = [headers, ...rows];
      
      // Convert to tab-separated values (TSV) for Excel compatibility
      const tsvContent = allRows.map(row => row.join('\t')).join('\n');
      
      await navigator.clipboard.writeText(tsvContent);
      
      toast({
        title: "Copied to Clipboard!",
        description: `${contacts.length} contacts copied. You can now paste directly into Excel.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy data to clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    try {
      // Create header row
      const headers = [
        'First Name', 'Last Name', 'Title', 'Company', 'Email', 
        'Mobile Phone', 'Other Phone', 'Corporate Phone', 
        'Person LinkedIn', 'Company LinkedIn', 'Website'
      ];
      
      // Create data rows
      const rows = contacts.map(contact => [
        contact.firstName || '',
        contact.lastName || '',
        contact.title || '',
        contact.company || '',
        contact.email || '',
        contact.mobilePhone || '',
        contact.otherPhone || '',
        contact.corporatePhone || '',
        contact.personLinkedinUrl || '',
        contact.companyLinkedinUrl || '',
        contact.website || ''
      ]);
      
      // Combine header and data
      const allRows = [headers, ...rows];
      
      // Convert to CSV format
      const csvContent = allRows.map(row => 
        row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `campaign_contacts_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful!",
        description: `${contacts.length} contacts exported to CSV file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderPaginationButtons = () => {
    if (!pagination) return null;

    const { page, totalPages } = pagination;
    const buttons = [];
    const maxVisiblePages = 5;
    
    // Calculate range of pages to show
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(i)}
          className="h-8 w-8 p-0"
        >
          {i}
        </Button>
      );
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis" className="px-2 text-slate-500">...</span>
        );
      }
      buttons.push(
        <Button
          key={totalPages}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="h-8 w-8 p-0"
        >
          {totalPages}
        </Button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No contacts found</h3>
          <p className="text-slate-600">No contacts match your current search or filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white">
      {/* Export Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {contacts.length.toLocaleString()} contacts loaded
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copy All to Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-40">
            <tr>
              <th className="w-12 p-3 text-left border-r border-slate-200 bg-slate-100">
                <Checkbox
                  checked={selectedContacts.size === contacts.length && contacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="p-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 min-w-[150px] bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span>First Name</span>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('firstName')} className="h-6 w-6 p-0">
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </div>
              </th>
              <th className="p-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 min-w-[150px] bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span>Last Name</span>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('lastName')} className="h-6 w-6 p-0">
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </div>
              </th>
              <th className="p-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 min-w-[180px] bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span>Title</span>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('title')} className="h-6 w-6 p-0">
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </div>
              </th>
              <th className="p-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 min-w-[180px] bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span>Company</span>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('company')} className="h-6 w-6 p-0">
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </div>
              </th>
              <th className="p-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 min-w-[220px] bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span>Email</span>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('email')} className="h-6 w-6 p-0">
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </div>
              </th>
              <th className="p-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 min-w-[150px] bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span>Mobile Phone</span>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('mobilePhone')} className="h-6 w-6 p-0">
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </div>
              </th>
              <th className="p-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 min-w-[200px] bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span>LinkedIn</span>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('personLinkedinUrl')} className="h-6 w-6 p-0">
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </div>
              </th>
              <th className="p-3 text-left text-sm font-semibold text-slate-900 min-w-[180px] bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span>Website</span>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('website')} className="h-6 w-6 p-0">
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border-r border-slate-200 bg-slate-50">
                  <Checkbox
                    checked={selectedContacts.has(contact.id)}
                    onCheckedChange={(checked) => handleSelectContact(contact.id, !!checked)}
                  />
                </td>
                <td className="p-3 text-sm text-slate-900 border-r border-slate-200">
                  {contact.firstName || '-'}
                </td>
                <td className="p-3 text-sm text-slate-900 border-r border-slate-200">
                  {contact.lastName || '-'}
                </td>
                <td className="p-3 text-sm text-slate-900 border-r border-slate-200">
                  {contact.title || '-'}
                </td>
                <td className="p-3 text-sm text-slate-900 border-r border-slate-200">
                  {contact.company || '-'}
                </td>
                <td className="p-3 text-sm border-r border-slate-200">
                  {contact.email ? (
                    <a 
                      href={`mailto:${contact.email}`} 
                      className="text-primary hover:underline"
                    >
                      {contact.email}
                    </a>
                  ) : '-'}
                </td>
                <td className="p-3 text-sm text-slate-900 border-r border-slate-200">
                  {contact.mobilePhone || '-'}
                </td>
                <td className="p-3 text-sm border-r border-slate-200">
                  {contact.personLinkedinUrl ? (
                    <a 
                      href={contact.personLinkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline flex items-center space-x-1"
                    >
                      <span className="truncate max-w-[150px]">
                        {contact.personLinkedinUrl.replace('https://linkedin.com/in/', '/in/')}
                      </span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  ) : '-'}
                </td>
                <td className="p-3 text-sm">
                  {contact.website ? (
                    <a 
                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline flex items-center space-x-1"
                    >
                      <span className="truncate max-w-[150px]">
                        {contact.website.replace(/^https?:\/\//, '')}
                      </span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </div>
  );
}
