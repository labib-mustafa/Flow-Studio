import React from 'react';
import { motion } from 'motion/react';
import { DashboardHeader } from './DashboardHeader';
import { StatCards } from './StatCards';
import { OngoingProjects } from './OngoingProjects';
import { Renewals } from './Renewals';
import { TimeActivity } from './TimeActivity';
import { RightPanel } from './RightPanel';

export interface DashboardProps {
  onNavigate?: (view: string) => void;
  onProjectClick?: (project: any) => void;
  onNewProject?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut'
    }
  }
};

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onProjectClick,
  onNewProject
}) => {
  return (
    <div className="flex h-full overflow-hidden bg-[#f5f5f7]">
      <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-white">
        <motion.div 
          className="max-w-7xl mx-auto flex flex-col gap-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <DashboardHeader onNavigate={onNavigate} />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <StatCards onNavigate={onNavigate} />
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 xl:grid-cols-3 gap-6" 
            variants={itemVariants}
          >
            <OngoingProjects onNavigate={onNavigate} onProjectClick={onProjectClick} onNewProject={onNewProject} />
            <Renewals onNavigate={onNavigate} onProjectClick={onProjectClick} />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <TimeActivity />
          </motion.div>
        </motion.div>
      </div>
      <RightPanel onNavigate={onNavigate} onNewProject={onNewProject} />
    </div>
  );
};
