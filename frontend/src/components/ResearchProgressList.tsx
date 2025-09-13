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

import { useEffect, useRef } from 'react';
import styles from './ResearchProgressList.module.css';
import ResearchProgressItem from './ResearchProgressItem';
import ResearchProgressFooter from './ResearchProgressFooter';
import ResearchProgressHeader from './ResearchProgressHeader';
import { ApplicationState } from '@/types/ApplicationState';

export type ResearchEventType =
  | 'started'
  | 'completed'
  | 'error'
  | 'prompt_received'
  | 'prompt_analysis_started'
  | 'prompt_analysis_completed'
  | 'task_analysis_completed'
  | 'topic_exploration_started'
  | 'topic_exploration_completed'
  | 'search_started'
  | 'search_result_processing_started'
  | 'aggregation_started'
  | 'research_completed'
  | 'report_building'
  | 'report_processing'
  | 'report_done'
  | 'generic';

export interface ResearchEvent {
  id: string;
  type: ResearchEventType;
  description: string;
  timestamp: number;
}

interface ResearchProgressListProps {
  state: ApplicationState;
  onStop?: () => void;
  onClear?: () => void;
  onFinalize?: () => void;
  onViewError?: () => void;
}

export default function ResearchProgressList({
  state,
  onStop,
  onClear,
  onFinalize,
  onViewError
}: ResearchProgressListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevEventsLengthRef = useRef<number>(0);
  const userHasScrolledRef = useRef<boolean>(false);

  useEffect(() => {
    // Only scroll if we have new events, the list exists, and user hasn't scrolled
    if (listRef.current && state.events.length > prevEventsLengthRef.current && !userHasScrolledRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      prevEventsLengthRef.current = state.events.length;
      //console.log('scrolling to bottom');
    }
  }, [state.events]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    // Check if we're not at the bottom
    if (element.scrollHeight - element.scrollTop - element.clientHeight > 10) {
      userHasScrolledRef.current = true;
    } else {
      // Reset the flag if user scrolls back to bottom
      userHasScrolledRef.current = false;
      //console.log('resetting scroll flag');
    }
  };

  return (
    <div className={styles.wrapper}>
      {state.type !== 'idle' && (
        <div className={styles.content}>
          <div className={styles.container}>
            <ResearchProgressHeader
              state={state}
              onStop={onStop}
              onClear={onClear}
              onFinalize={onFinalize}
              onViewError={onViewError}
            />
            <div
              ref={listRef}
              className={styles.list}
              onScroll={handleScroll}
            >
              {state.events.map((event) => (
                <ResearchProgressItem key={event.id} event={event} />
              ))}
            </div>
            <ResearchProgressFooter state={state} />
          </div>
        </div>
      )}
    </div>
  );
} 