/**
 * Copyright 2021 Shift Crypto AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ReactNode } from 'react';
import style from './grid.module.css';

type TGridProps = {
  children: ReactNode;
}

export const Grid = ({ children }: TGridProps) => {
  return (
    <section className={style.grid}>
      {children}
    </section>
  );
};

type TColumnProps = {
  asCard?: boolean;
  children: ReactNode;
}

export const Column = ({
  asCard,
  children,
}: TColumnProps) => {
  return (
    <div className={`${style.column} ${asCard ? style.columnAsCard : ''}`}>
      {children}
    </div>
  );
};

type TColumnButtonsProps = {
  children: ReactNode;
}

export const ColumnButtons = ({ children }: TColumnButtonsProps) => {
  return (
    <div className={style.columnButtons}>
      {children}
    </div>
  );
};
