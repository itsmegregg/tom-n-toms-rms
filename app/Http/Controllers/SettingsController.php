<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Concept;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Index', [
            'categories' => Category::all(),
            'branches' => Branch::with('concept')->get(),
            'concepts' => Concept::all()
        ]);
    }
}
