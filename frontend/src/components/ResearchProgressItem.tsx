/*
 * SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use client';

import { ArrowDownOnSquareIcon, BoltIcon, ExclamationCircleIcon, BeakerIcon, MagnifyingGlassIcon, DocumentMagnifyingGlassIcon, DocumentCheckIcon, ClipboardDocumentListIcon, ArchiveBoxIcon, Cog8ToothIcon, LightBulbIcon, DocumentTextIcon, CheckCircleIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { ResearchEvent, ResearchEventType } from './ResearchProgressList';
import styles from './ResearchProgressItem.module.css';

interface ResearchProgressItemProps {
  event: ResearchEvent;
}

const iconMap: Record<ResearchEventType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'started': BoltIcon,
  'completed': CheckCircleIcon,
  'error': ExclamationCircleIcon,
  'prompt_received': ArrowDownOnSquareIcon,
  'prompt_analysis_started': BeakerIcon,
  'prompt_analysis_completed': DocumentTextIcon,
  'task_analysis_completed': DocumentTextIcon,
  'topic_exploration_started': DocumentMagnifyingGlassIcon,
  'topic_exploration_completed': DocumentCheckIcon,
  'search_started': MagnifyingGlassIcon,
  'search_result_processing_started': ClipboardDocumentListIcon,
  'aggregation_started': ArchiveBoxIcon,
  'research_completed': CheckCircleIcon,
  'report_building': Cog8ToothIcon,
  'report_processing': LightBulbIcon,
  'report_done': DocumentTextIcon,
  'generic': ChatBubbleLeftEllipsisIcon
};

export default function ResearchProgressItem({ event }: ResearchProgressItemProps) {
  const Icon = iconMap[event.type] || ChatBubbleLeftEllipsisIcon;
  const iconColor = event.type === 'error' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className={styles.item}>
      <div className={styles.iconContainer}>
        <Icon className={styles.icon} style={{ color: iconColor }} />
      </div>
      <div className={styles.content}>
        <p className={styles.description}>{event.description}</p>
        <span className={styles.timestamp}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
} 