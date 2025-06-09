<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id('branch_id');
            $table->string('branch_name');
            $table->text('branch_description');
            $table->text('branch_address');
            $table->foreignId('concept_id')->constrained('concepts', 'concept_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('branches');
    }
};
