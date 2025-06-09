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
import { Plus, Upload, Search, Pen, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import axios from 'axios';
import { useToast } from "@/Components/ui/use-toast";

interface Branch {
  branch_id: number;
  branch_name: string;
  branch_description: string;
  branch_address: string;
  concept_id: number;
  concept?: {
    concept_id: number;
    concept_name: string;
  };
  created_at: string;
  updated_at: string;
}

interface Concept {
  concept_id: number;
  concept_name: string;
}

interface BranchesProps {
  branches?: Branch[];
  concepts?: Concept[];
}

export default function Branches({ branches: initialBranches = [], concepts = [] }: BranchesProps) {
  const [branches, setBranches] = React.useState<Branch[]>(initialBranches);
  const [filteredBranches, setFilteredBranches] = React.useState<Branch[]>(initialBranches);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    branch_name: '',
    branch_description: '',
    branch_address: '',
    concept_id: ''
  });
  const [editData, setEditData] = React.useState<Branch | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const { toast } = useToast();

  // Fetch branches on component mount
  React.useEffect(() => {
    fetchBranches();
  }, []);

  // Search functionality
  React.useEffect(() => {
    const results = branches.filter(branch =>
      branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.branch_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.branch_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.concept?.concept_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBranches(results);
  }, [searchTerm, branches]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get('/api/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch branches",
        duration: 3000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        concept_id: parseInt(formData.concept_id)
      };

      await axios.post('/api/branches', submitData);
      await fetchBranches();
      setOpen(false);
      setFormData({
        branch_name: '',
        branch_description: '',
        branch_address: '',
        concept_id: ''
      });
      toast({
        title: "Success",
        description: "Branch created successfully",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Submit error:', error.response?.data);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to create branch",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    setLoading(true);
    try {
      await axios.put(`/api/branches/${editData.branch_id}`, editData);
      await fetchBranches();
      setEditOpen(false);
      setEditData(null);
      toast({
        title: "Success",
        description: "Branch updated successfully",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Update error:', error.response?.data);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to update branch",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    setLoading(true);
    try {
      await axios.delete(`/api/branches/${id}`);
      await fetchBranches();
      toast({
        title: "Success",
        description: "Branch deleted successfully",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Delete error:', error.response?.data);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to delete branch",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (branch: Branch) => {
    setEditData(branch);
    setEditOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <CardTitle>Branches</CardTitle>
        <div className="flex items-center space-x-2">
        <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                onChange={handleSearch}
                className="pl-8"
              />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={loading}>
                <Plus className="mr-2 h-4 w-4" /> Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Branch</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branch_name">Branch Name</Label>
                  <Input
                    id="branch_name"
                    value={formData.branch_name}
                    onChange={e => setFormData({ ...formData, branch_name: e.target.value })}
                    placeholder="Enter branch name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_description">Description</Label>
                  <Input
                    id="branch_description"
                    value={formData.branch_description}
                    onChange={e => setFormData({ ...formData, branch_description: e.target.value })}
                    placeholder="Enter branch description"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_address">Address</Label>
                  <Input
                    id="branch_address"
                    value={formData.branch_address}
                    onChange={e => setFormData({ ...formData, branch_address: e.target.value })}
                    placeholder="Enter branch address"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concept_id">Concept</Label>
                  <Select
                    value={formData.concept_id}
                    onValueChange={(value) => setFormData({ ...formData, concept_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a concept" />
                    </SelectTrigger>
                    <SelectContent>
                      {concepts.map((concept) => (
                        <SelectItem key={concept.concept_id} value={concept.concept_id.toString()}>
                          {concept.concept_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
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
                    {loading ? 'Adding...' : 'Add Branch'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">


          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Branch Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-[150px]">Concept</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow key={branch.branch_id}>
                    <TableCell className="w-[200px]">{branch.branch_name}</TableCell>
                    <TableCell>{branch.branch_description}</TableCell>
                    <TableCell>{branch.branch_address}</TableCell>
                    <TableCell className="w-[150px]">{branch.concept?.concept_name}</TableCell>
                    <TableCell className="w-[100px]">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(branch)}
                          disabled={loading}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(branch.branch_id)}
                          disabled={loading}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBranches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      {searchTerm ? 'No branches found matching your search' : 'No branches available'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Branch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_branch_name">Branch Name</Label>
                <Input
                  id="edit_branch_name"
                  value={editData?.branch_name || ''}
                  onChange={e => setEditData(prev => prev ? { ...prev, branch_name: e.target.value } : null)}
                  placeholder="Enter branch name"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_branch_description">Description</Label>
                <Input
                  id="edit_branch_description"
                  value={editData?.branch_description || ''}
                  onChange={e => setEditData(prev => prev ? { ...prev, branch_description: e.target.value } : null)}
                  placeholder="Enter branch description"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_branch_address">Address</Label>
                <Input
                  id="edit_branch_address"
                  value={editData?.branch_address || ''}
                  onChange={e => setEditData(prev => prev ? { ...prev, branch_address: e.target.value } : null)}
                  placeholder="Enter branch address"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_concept_id">Concept</Label>
                <Select
                  value={editData?.concept_id.toString() || ''}
                  onValueChange={(value) => setEditData(prev => prev ? { ...prev, concept_id: parseInt(value) } : null)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a concept" />
                  </SelectTrigger>
                  <SelectContent>
                    {concepts.map((concept) => (
                      <SelectItem key={concept.concept_id} value={concept.concept_id.toString()}>
                        {concept.concept_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
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
                  {loading ? 'Updating...' : 'Update Branch'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
