<?php

namespace Exia\CoreBundle\Repository;

use Doctrine\ORM\EntityRepository;

class FormationRepository extends EntityRepository
{
    public function liste()
    {
        $qb = $this->_em->createQueryBuilder()
          ->select('a')
          ->from($this->_entityName, 'a')
          ->orderBy('a.annee', 'ASC')
        ;
        
        return $qb
          ->getQuery()
          ->getResult()
        ;
    }
    
   
    
}