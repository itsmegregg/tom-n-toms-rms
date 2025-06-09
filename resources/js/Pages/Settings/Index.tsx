import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import Categories from './Partials/Categories';
import Concepts from './Partials/Concepts';
import Branches from './Partials/Branches';
import { PageProps } from '@/types';
import axios from 'axios';
import { useToast } from '@/Components/ui/use-toast';

interface Category {
  id: number;
  category_code: string;
  category_name: string;
  category_desc: string;
  created_at: string;
  updated_at: string;
}

interface Concept {
  concept_id: number;
  concept_name: string;
}

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

interface Props extends PageProps {
  categories: Category[];
  branches: Branch[];
  concepts: Concept[];
}

export default function Settings({ auth, categories, branches, concepts }: Props) {
  const { toast } = useToast();

  return (
    <AuthenticatedLayout
      user={auth.user}
    >
      <Head title="Settings" />
      <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        
        <div className="bg-background">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="concepts">Concepts</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
            </TabsList>
            <TabsContent value="categories" className="mt-6">
              <Categories categories={categories} />
            </TabsContent>
            <TabsContent value="concepts" className="mt-6">
              <Concepts />
            </TabsContent>
            <TabsContent value="branches" className="mt-6">
              <Branches branches={branches} concepts={concepts} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
