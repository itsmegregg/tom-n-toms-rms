import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Plus, Pencil, Trash2, Search, Upload, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { useToast } from "@/Components/ui/use-toast";
import axios from 'axios';

interface Concept {
  concept_id: number;
  concept_name: string;
  concept_description: string;
  branches?: any[];
  created_at: string;
  updated_at: string;
}

export default function Concepts() {
  const [concepts, setConcepts] = React.useState<Concept[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedConcept, setSelectedConcept] = React.useState<Concept | null>(null);
  const [formData, setFormData] = React.useState({
    concept_name: '',
    concept_description: '',
  });
  const [editData, setEditData] = React.useState<Concept | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredConcepts, setFilteredConcepts] = React.useState<Concept[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchConcepts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/concepts');
      setConcepts(response.data);
      setFilteredConcepts(response.data);
    } catch (error) {
      console.error('Error fetching concepts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load concepts",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConcepts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/api/concepts', formData);
      await fetchConcepts();
      setOpen(false);
      setFormData({ concept_name: '', concept_description: '' });
      toast({
        title: "Success",
        description: "Concept added successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error adding concept:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add concept",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConcept || !editData) return;
    try {
      setLoading(true);
      await axios.put(`/api/concepts/${selectedConcept.concept_id}`, editData);
      await fetchConcepts();
      setEditOpen(false);
      setSelectedConcept(null);
      setEditData(null);
      toast({
        title: "Success",
        description: "Concept updated successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating concept:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update concept",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (concept: Concept) => {
    if (!confirm('Are you sure you want to delete this concept?')) return;
    try {
      setLoading(true);
      await axios.delete(`/api/concepts/${concept.concept_id}`);
      await fetchConcepts();
      toast({
        title: "Success",
        description: "Concept deleted successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting concept:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete concept",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload",
        duration: 3000,
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);

    try {
      setLoading(true);
      await axios.post('/api/concepts/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchConcepts();
      setUploadOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Success",
        description: "Concepts imported successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error importing concepts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to import concepts",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    const filtered = concepts.filter(concept => 
      concept.concept_name.toLowerCase().includes(term.toLowerCase()) ||
      concept.concept_description.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredConcepts(filtered);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <CardTitle>Concepts</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search concepts..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Concept
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Concept</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAdd} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="concept_name">Concept Name</Label>
                      <Input
                        id="concept_name"
                        name="concept_name"
                        value={formData.concept_name}
                        onChange={handleInputChange}
                        placeholder="Enter concept name"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="concept_description">Description</Label>
                      <Input
                        id="concept_description"
                        name="concept_description"
                        value={formData.concept_description}
                        onChange={handleInputChange}
                        placeholder="Enter concept description"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Concepts</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csv_file">CSV File</Label>
                      <Input
                        id="csv_file"
                        name="file"
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setUploadOpen(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Importing...' : 'Import'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredConcepts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No concepts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConcepts.map((concept) => (
                    <TableRow key={concept.concept_id}>
                      <TableCell className="font-medium">{concept.concept_name}</TableCell>
                      <TableCell>{concept.concept_description}</TableCell>
                      <TableCell>{concept.branches?.length || 0}</TableCell>
                      <TableCell>{new Date(concept.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(concept.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedConcept(concept);
                              setEditData(concept);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive" 
                            size="icon"
                            onClick={() => handleDelete(concept)}
                          >
                        <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Concept</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_concept_name">Concept Name</Label>
              <Input
                id="edit_concept_name"
                name="concept_name"
                value={editData?.concept_name || ''}
                onChange={(e) => {
                  setEditData(prev => prev ? { ...prev, concept_name: e.target.value } : null);
                }}
                placeholder="Enter concept name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_concept_description">Description</Label>
              <Input
                id="edit_concept_description"
                name="concept_description"
                value={editData?.concept_description || ''}
                onChange={(e) => {
                  setEditData(prev => prev ? { ...prev, concept_description: e.target.value } : null);
                }}
                placeholder="Enter concept description"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
