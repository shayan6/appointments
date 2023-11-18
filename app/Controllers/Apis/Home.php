<?php

namespace App\Controllers\Apis;

use App\Controllers\BaseController;
use App\Models\HomeModel;
use App\Libraries\SettingLibrary;

class Home extends BaseController
{
  public function __construct()
  {
    $db = db_connect();
    $this->HomeModel = new HomeModel($db);
    $this->SettingLibrary = new SettingLibrary();
    $this->request = service('request');
  }

  // #####################################################################################################
  // api create data #####################################################################################
  // #####################################################################################################

  public function createAppointment()
  {
    if ($this->request->getMethod() == 'post') {

      $req = json_decode($this->request->getBody());
      $data = [
        'first_name' => $req->first_name,
        'last_name' => $req->last_name,
        'date_of_birth' => $req->date_of_birth,
        'country_id' => $req->country_id,
        'mobile_number' => $req->mobile_number,
        'emirates' => $req->emirates,
        'email' => $req->email,
        'marital_status' => $req->marital_status,
        'created_date' => date('Y-m-d H:i:s'),
      ];

      $customer_id = $this->HomeModel->createCustomer($data);

      $appointment = [
        'customer_id' => $customer_id,
        'staff_id' => $req->staff,
        'service_id' => $req->service,
        'location_id' => $req->location,
        'date' => $req->date,
        'time' => $req->time,
        'created_date' => date('Y-m-d H:i:s'),
      ];

      $appointment_id = $this->HomeModel->createAppointment($appointment);

      // Response Api ####################################################################
      $this->SettingLibrary->send_json([
        'status' => 1,
        'message' => 'success',
        'result' => ['appointment_id' => $appointment_id, 'customer_id' => $customer_id]
      ]);
    }
  }


  // #####################################################################################################
  // api read data #######################################################################################
  // #####################################################################################################
  public function getAppointments()
  {
    $pageNo = $this->request->getGet('pageNo') ? $this->request->getGet('pageNo') : 1;
    $pageSize = $this->request->getGet('pageSize') ? $this->request->getGet('pageSize') : 20;
    $search = $this->request->getGet('search') ? $this->request->getGet('search') : '';
    $sortBy = $this->request->getGet('sortBy') ? $this->request->getGet('sortBy') : 'location_name';
    $sortDesc = $this->request->getGet('sortDesc');
    $this->SettingLibrary->send_json($this->HomeModel->getAppointments($pageNo, $pageSize, $search, $sortBy, $sortDesc));
  }

  public function getPanelSettings()
  {
    $this->SettingLibrary->send_json($this->HomeModel->getPanelSettings());
  }

  public function getFrontEndPanels()
  {
    $this->SettingLibrary->send_json($this->HomeModel->getFrontEndPanels());
  }

  public function saveFrontEndPanels()
  {
    $jsonData = json_decode(file_get_contents('php://input'), true);
    if (is_array($jsonData) && isset($jsonData[0])) {
      $this->SettingLibrary->send_json(array("status" => $this->HomeModel->saveFrontEndPanels($jsonData)));
      // Use $firstElement or perform desired operations
    } else {
      // Handle the case when the JSON data is not an array or index 0 does not exist
      $this->SettingLibrary->send_json("Handle the case when the JSON data is not an array or index 0 does not exist");
    }
  }

  public function getLocations()
  {
    $location = $this->request->getGet('location');
    $staff = $this->request->getGet('staff');
    $service = $this->request->getGet('service');
    $this->SettingLibrary->send_json($this->HomeModel->getLocations($location, $staff, $service));
  }

  public function getStaff()
  {
    $location = $this->request->getGet('location');
    $staff = $this->request->getGet('staff');
    $service = $this->request->getGet('service');
    $this->SettingLibrary->send_json($this->HomeModel->getStaff($location, $staff, $service));
  }

  public function getServices()
  {
    $location = $this->request->getGet('location');
    $staff = $this->request->getGet('staff');
    $service = $this->request->getGet('service');
    $this->SettingLibrary->send_json($this->HomeModel->getServices($location, $staff, $service));
  }

  public function getDatetime()
  {
    $date = $this->request->getGet('date');
    $this->SettingLibrary->send_json($this->HomeModel->getDatetime($date));
  }

  public function getCountry()
  {
    $pageNo = $this->request->getGet('pageNo');
    $pageSize = $this->request->getGet('pageSize');
    $search = $this->request->getGet('search');
    $this->SettingLibrary->send_json($this->HomeModel->getCountry($pageNo, $pageSize, $search));
  }

  public function getAvailability()
  {
    $list = $this->HomeModel->getWorkhours(0);
    $staffSlots = [];

    for ($i = 0; $i < sizeof($list); $i++) {
      print_r('<br>');
      print_r($list[$i]);

      $staffSlots[] = [
        'staff' => $list[$i]->staff_id,
        'startTime' => $list[$i]->start_time,
        'endTime' => $list[$i]->end_time,
      ];

      print_r('<br>');
    }

    print_r($staffSlots);
  }
}
