<?php

namespace App\Models;

use CodeIgniter\Database\ConnectionInterface;

class HomeModel
{
    protected $db;
    public function __construct(ConnectionInterface &$db)
    {
        $this->db = &$db;
    }

    // #####################################################################################################
    // models create data ##################################################################################
    // #####################################################################################################

    public function createCustomer($data)
    {
        $this->db->table('customers')->insert($data);
        return $this->db->insertID();
    }

    public function createAppointment($data)
    {
        $this->db->table('appointments')->insert($data);
        return $this->db->insertID();
    }

    // #####################################################################################################
    // models read data ####################################################################################
    // #####################################################################################################
    public function getAppointments($pageNo, $pageSize, $search, $sortBy, $sortDesc)
    {

        $offset = ($pageNo - 1) * $pageSize;
        $sortBy = $sortBy ? $sortBy : 'date';
        $sortDesc = $sortDesc == 1 ? 'DESC' : 'ASC';

        $q = $this->db->table('appointments a')
            ->select('a.*
                 ,CONCAT(c.first_name, " ", c.last_name) as customer_name
                 ,c.email
                 ,c.mobile_number
                 ,CONCAT(s.first_name, " ", s.last_name) as staff_name
                 ,(SELECT cu.currency_symbol FROM currencies cu WHERE cu.currency_id = se.service_currency_id) as currency_symbol
                 ,se.*
                 ,l.*
                ')
            ->join('customers c', 'c.`customer_id` = a.`customer_id`', 'left')
            ->join('staff s', 's.`staff_id` = a.`staff_id`', 'left')
            ->join('services se', 'se.`service_id` = a.`service_id`', 'left')
            ->join('locations l', 'l.`location_id` = a.`location_id`', 'left')
            ->orderby("$sortBy $sortDesc")
            ->limit($pageSize, $offset);

        if ($search != '') {
            $q->where("c.first_name LIKE '%$search%' OR s.first_name LIKE '%$search%'");
        }

        return $q->get()->getResult();
    }

    public function getPanelSettings()
    {
        return $this->db->table('front_end_panels')->orderBy('priority')->get()->getResult();
    }

    public function getFrontEndPanels()
    {
        return $this->db->table('front_end_panels')->where('is_active = true')->orderBy('priority')->get()->getResult();
    }

    public function saveFrontEndPanels($post)
    {
        try {
            return $this->db->table('front_end_panels')->updateBatch($post, 'id');
        } catch (\Exception $e) {
            // do something here...
            exit($e->getMessage());
        }
    }

    public function getLocations($location, $staff, $service)
    {
        $q = $this->db->table('locations l');

        if ($staff) {
            $q->join('staff_locataions sl', 'sl.location_id = l.location_id')->where('sl.staff_id = ' . $staff);
        }

        return $q->get()->getResult();
    }

    public function getStaff($location, $staff, $service)
    {
        $q = $this->db->table('staff s');

        if ($location) {
            $q->join('staff_locataions sl', 'sl.staff_id = s.staff_id')->where('sl.location_id = ' . $location);
        }

        if ($service) {
            $q->join('staff_services ss', 'ss.staff_id = s.staff_id')->where('ss.service_id = ' . $service);
        }

        return $q->get()->getResult();
    }

    public function getServices($location, $staff, $service)
    {
        $q = $this->db->table('services s');

        if ($staff) {
            $q->join('staff_services ss', 'ss.service_id = s.service_id')->where('ss.staff_id = ' . $staff);
        }

        return $q->get()->getResult();
    }

    public function getDatetime($date)
    {
        $q = $this->db->table('work_hours wh')->where('TIME(' . $date . ') BETWEEN wh.start_time AND wh.end_time');
        return $q->get()->getResult();
    }

    public function getCountry($pageNo, $pageSize, $search)
    {
        $offset = ($pageNo - 1) * $pageSize;
        $q = $this->db->table('countries c')->where("c.`country_code` LIKE '$search%' OR c.`country_name` LIKE '$search%'")->limit($pageSize, $offset);
        return $q->get()->getResult();
    }

    public function getWorkhours($day_id)
    {
        $q = $this->db->table('work_hours wh')->where("wh.`day_id` = $day_id");
        return $q->get()->getResult();
    }
}
