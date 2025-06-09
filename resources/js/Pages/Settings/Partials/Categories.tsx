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
import { Textarea } from "@/Components/ui/textarea";
import axios from 'axios';
import { useToast } from "@/Components/ui/use-toast";

interface Category {
  id: number;
  category_code: string;
  category_desc: string;
  created_at: string;
  updated_at: string;
}

interface CategoriesProps {
  categories: Category[];
}

export default function Categories({ categories: initialCategories }: CategoriesProps) {
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [filteredCategories, setFilteredCategories] = React.useState<Category[]>(initialCategories);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    category_code: '',
    category_desc: ''
  });
  const [editData, setEditData] = React.useState<Category | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Search functionality
  const handleSearch = (term: string) => {
    const filtered = categories.filter(category => 
      category.category_code.toLowerCase().includes(term.toLowerCase()) ||
      category.category_desc.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredCategories(filtered);
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories",
        duration: 3000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/categories', formData);
      await fetchCategories();
      setOpen(false);
      setFormData({ category_code: '', category_desc: '' });
      toast({
        title: "Success",
        description: "Category created successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create category",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a CSV file first",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('csv_file', file);

    try {
      const response = await axios.post('/api/categories/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      
      await fetchCategories();
      setUploadOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Success",
        description: response.data.message || "Categories imported successfully",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Import error:', error.response?.data);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to import categories. Please check your CSV file.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    setLoading(true);
    try {
      await axios.delete(`/api/categories/${id}`);
      await fetchCategories();
      toast({
        title: "Success",
        description: "Category deleted successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category",
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
      const response = await axios.put(`/api/categories/${editData.id}`, {
        category_code: editData.category_code,
        category_desc: editData.category_desc,
      });
      
      await fetchCategories();
      setEditOpen(false);
      setEditData(null);
      toast({
        title: "Success",
        description: "Category updated successfully",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Update error:', error.response?.data);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to update category",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <CardTitle>Categories</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
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
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_code">Category Code</Label>
                      <Input
                        id="category_code"
                        value={formData.category_code}
                        onChange={e => setFormData(prev => ({ ...prev, category_code: e.target.value }))}
                        placeholder="Enter category code"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category_desc">Description</Label>
                      <Input
                        id="category_desc"
                        value={formData.category_desc}
                        onChange={e => setFormData(prev => ({ ...prev, category_desc: e.target.value }))}
                        placeholder="Enter category description"
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
                    <DialogTitle>Import Categories</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csv_file">CSV File</Label>
                      <Input
                        id="csv_file"
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
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.category_code}</TableCell>
                      <TableCell>{category.category_desc}</TableCell>
                      <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(category.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditData(category);
                              setEditOpen(true);
                            }}
                          >
                            <Pen className="h-4 w-4" />
                          </Button>
                          <Button
                           variant="destructive" 
                            size="icon"
                            onClick={() => handleDelete(category.id)}
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
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_category_code">Category Code</Label>
              <Input
                id="edit_category_code"
                value={editData?.category_code || ''}
                onChange={e => setEditData(prev => prev ? { ...prev, category_code: e.target.value } : null)}
                placeholder="Enter category code"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_category_desc">Description</Label>
              <Input
                id="edit_category_desc"
                value={editData?.category_desc || ''}
                onChange={e => setEditData(prev => prev ? { ...prev, category_desc: e.target.value } : null)}
                placeholder="Enter category description"
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
