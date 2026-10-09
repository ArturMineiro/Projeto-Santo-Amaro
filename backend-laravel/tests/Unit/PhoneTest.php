<?php

namespace Tests\Unit;

use App\Support\Phone;
use PHPUnit\Framework\TestCase;

class PhoneTest extends TestCase
{
    public function test_normalize(): void
    {
        $this->assertSame('5511999998888', Phone::normalize('(11) 99999-8888'));
        $this->assertSame('5511999998888', Phone::normalize('+55 11 99999-8888'));
        $this->assertSame('5511999998888', Phone::normalize('011 99999-8888'));
        $this->assertSame('551133334444', Phone::normalize('11 3333-4444'));
    }

    public function test_validation_and_format(): void
    {
        $this->assertTrue(Phone::isValid('11999998888'));
        $this->assertFalse(Phone::isValid('99998888'));
        $this->assertFalse(Phone::isValid(''));
        $this->assertSame('(11) 99999-8888', Phone::format('5511999998888'));
    }

    public function test_first_name_skips_honorifics(): void
    {
        $this->assertSame('Benedita', (new \App\Models\User(['name' => 'Dona Benedita Souza']))->firstName());
        $this->assertSame('José', (new \App\Models\User(['name' => 'Seu José']))->firstName());
        $this->assertSame('Dona', (new \App\Models\User(['name' => 'Dona']))->firstName());
    }
}
