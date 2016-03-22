<?php

namespace Exia\CoreBundle\Repository;

use Doctrine\ORM\EntityRepository;

class ProfilRepository extends EntityRepository
{
    public function liste()
    {
        $qb = $this->_em->createQueryBuilder()
          ->select('a')
          ->from($this->_entityName, 'a')
        ;
        
        return $qb
          ->getQuery()
          ->getResult()
        ;
    }
    
   
    
}