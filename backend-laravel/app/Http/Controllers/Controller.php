<?php

namespace App\Http\Controllers;

use App\Models\Association;
use App\Models\Membership;
use Illuminate\Http\Request;

abstract class Controller
{
    /** Vínculo resolvido pelo middleware "association". */
    protected function membership(Request $request): Membership
    {
        return $request->attributes->get('membership');
    }

    protected function association(Request $request): Association
    {
        return $request->attributes->get('association');
    }
}
