import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  CloudUpload,
  FileText,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";
import { detectCSVFields } from "@/lib/csv-utils";
import type { FieldMapping } from "@shared/schema";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FileInfo {
  name: string;
  size: number;
  rowCount: number;
  headers: string[];
  detectedMapping: Partial<FieldMapping>;
}

export default function UploadModal({ open, onOpenChange, onSuccess }: UploadModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [fieldMapping, setFieldMapping] = useState<Partial<FieldMapping>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse CSV mutation
  const parseCSVMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('/api/csv/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse CSV file');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setFileInfo({
        name: data.fileName,
        size: data.fileSize,
        rowCount: data.rowCount,
        headers: data.headers,
        detectedMapping: data.detectedMapping,
      });
      setFieldMapping(data.detectedMapping);
      setStep('mapping');
    },
    onError: () => {
      toast({
        title: "Parse Error",
        description: "Failed to parse CSV file. Please check the file format.",
        variant: "destructive"
      });
    },
  });

  // Upload campaign mutation
  const uploadCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !campaignName.trim()) {
        throw new Error('Missing required data');
      }

      const token = getAuthToken();
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('campaignName', campaignName.trim());
      formData.append('fieldMapping', JSON.stringify(fieldMapping));

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload campaign');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      resetModal();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const resetModal = () => {
    setStep('upload');
    setSelectedFile(null);
    setFileInfo(null);
    setCampaignName("");
    setFieldMapping({});
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setCampaignName(file.name.replace('.csv', ''));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setCampaignName(file.name.replace('.csv', ''));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const proceedToMapping = () => {
    if (selectedFile) {
      parseCSVMutation.mutate(selectedFile);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setCampaignName("");
  };

  const updateFieldMapping = (field: keyof FieldMapping, value: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [field]: value === 'skip' || value === 'none' ? undefined : value
    }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const standardFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'title', label: 'Title' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'mobilePhone', label: 'Mobile Phone' },
    { key: 'otherPhone', label: 'Other Phone' },
    { key: 'corporatePhone', label: 'Corporate Phone' },
    { key: 'personLinkedinUrl', label: 'Person LinkedIn URL' },
    { key: 'companyLinkedinUrl', label: 'Company LinkedIn URL' },
    { key: 'website', label: 'Website' },
  ];

  const autoDetectedFields = standardFields.filter(field => 
    fieldMapping[field.key as keyof FieldMapping]
  );

  const manualMappingFields = standardFields.filter(field => 
    !fieldMapping[field.key as keyof FieldMapping]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {step === 'upload' && (
          <>
            <DialogHeader>
              <DialogTitle>Upload Campaign CSV</DialogTitle>
              <p className="text-slate-600">Upload your campaign data file and we'll help you map the fields</p>
            </DialogHeader>

            <div className="space-y-6">
              {/* Campaign Name Input */}
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                />
              </div>

              {/* File Drop Zone */}
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-primary hover:bg-blue-50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CloudUpload className="text-primary h-8 w-8" />
                </div>
                <h4 className="text-lg font-medium text-slate-900 mb-2">Drop your CSV file here</h4>
                <p className="text-slate-600 mb-4">or click to browse files</p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-file-input"
                  onChange={handleFileSelect}
                />
                <Button type="button">
                  Select CSV File
                </Button>
                <p className="text-xs text-slate-500 mt-4">Supports CSV files up to 10MB</p>
              </div>

              {/* File Preview */}
              {selectedFile && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FileText className="text-emerald-600 h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-slate-900">{selectedFile.name}</h5>
                        <p className="text-sm text-slate-600">{formatBytes(selectedFile.size)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removeFile}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={proceedToMapping}
                disabled={!selectedFile || !campaignName.trim() || parseCSVMutation.isPending}
              >
                {parseCSVMutation.isPending ? "Processing..." : "Continue to Mapping"}
              </Button>
            </div>
          </>
        )}

        {step === 'mapping' && fileInfo && (
          <>
            <DialogHeader>
              <DialogTitle>Map CSV Fields</DialogTitle>
              <p className="text-slate-600">Match your CSV columns to our standard fields</p>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto space-y-6">
              {/* Auto-detected mappings */}
              {autoDetectedFields.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Auto-detected Fields
                  </h4>
                  <div className="space-y-3">
                    {autoDetectedFields.map(field => (
                      <div key={field.key} className="flex items-center space-x-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <div className="flex-1">
                          <span className="font-medium text-slate-900">{field.label}</span>
                          <span className="text-slate-600 ml-2">→</span>
                          <span className="text-emerald-700 ml-2 font-medium">
                            {fieldMapping[field.key as keyof FieldMapping]}
                          </span>
                        </div>
                        <Select
                          value={fieldMapping[field.key as keyof FieldMapping] || ""}
                          onValueChange={(value) => updateFieldMapping(field.key as keyof FieldMapping, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select column...</SelectItem>
                            {fileInfo.headers.map(header => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                            <SelectItem value="skip">Skip this field</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual mapping required */}
              {manualMappingFields.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Manual Mapping Required
                  </h4>
                  <div className="space-y-3">
                    {manualMappingFields.map(field => (
                      <div key={field.key} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-slate-200">
                        <div className="flex-1">
                          <span className="font-medium text-slate-900">{field.label}</span>
                        </div>
                        <div className="flex-1">
                          <Select
                            value={fieldMapping[field.key as keyof FieldMapping] || ""}
                            onValueChange={(value) => updateFieldMapping(field.key as keyof FieldMapping, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select CSV column..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select column...</SelectItem>
                              {fileInfo.headers.map(header => (
                                <SelectItem key={header} value={header}>{header}</SelectItem>
                              ))}
                              <SelectItem value="skip">Skip this field</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button 
                  onClick={() => uploadCampaignMutation.mutate()}
                  disabled={uploadCampaignMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{uploadCampaignMutation.isPending ? "Saving..." : "Save Campaign"}</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
