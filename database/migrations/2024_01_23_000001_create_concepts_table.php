<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('concepts', function (Blueprint $table) {
            $table->id('concept_id');
            $table->string('concept_name');
            $table->text('concept_description');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('concepts');
    }
};
