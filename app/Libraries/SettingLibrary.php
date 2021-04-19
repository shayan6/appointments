<?php

namespace App\Libraries;

class SettingLibrary
{

  public function __construct()
  {
  }

  public function send_json($data)
  {
    header('Content-Type: application/json');
    die(json_encode($data));
    exit;
  }
}
