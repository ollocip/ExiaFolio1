<?php

namespace Exia\CoreBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;

class CompetenceType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
        ->add('nom','text', array('required' => true))
        ->add('niveau', ChoiceType::class, array(
        'required' => false,
        'choices'  => array(
        'Maitrise parfaite' => 'Maitrise parfaite',
        'Maitrise moyenne' => 'Maitrise moyenne',
        'Maitrise faible ' => 'Maitrise faible ',

    )))
        ->add('categoriecompetences', 'entity', array(
            'class'    => 'ExiaCoreBundle:CategorieCompetences',
            'property' => 'Categorie',
            'multiple' => false
))
        
        ->add('afficher','checkbox', array('required' => false))
        ->add('save','submit');
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Exia\CoreBundle\Entity\Competence'
            ));
    }

    public function getName()
    {
        return 'exia_corebundle_competences';
    }
}