// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { createElement } from 'tsx-create-element';
import { FieldNames } from './constants';
import { GL_ORDINAL } from './vega-deck.gl/constants';
import { outerSize } from './vega-deck.gl/htmlHelpers';
import { Table, TableRow } from './vega-deck.gl/controls';

export interface TooltipOptions {
    exclude: (columnName: string) => boolean;
}

interface Props {
    cssPrefix: string;
    options: TooltipOptions;
    item: object;
    position?: { clientX: number; clientY: number };
}

interface RenderProps {
    cssPrefix: string;
    rows: TableRow[];
}

export class Tooltip {
    private element: HTMLElement;
    private child: HTMLElement;

    constructor(props: Props) {
        const renderProps: RenderProps = {
            cssPrefix: props.cssPrefix,
            rows: getRows(props.item, props.options)
        };
        this.element = renderTooltip(renderProps) as any as HTMLElement;
        if (this.element) {
            this.element.style.position = 'absolute';
            this.child = this.element.firstChild as HTMLElement;
            document.body.appendChild(this.element);
            //measure and move as necessary
            const m = outerSize(this.child);
            if (props.position.clientX + m.width >= document.documentElement.clientWidth) {
                this.child.style.right = '0';
            }
            if (props.position.clientY + m.height >= document.documentElement.clientHeight) {
                this.child.style.bottom = '0';
            }
            this.element.style.left = `${props.position.clientX}px`;
            this.element.style.top = `${props.position.clientY}px`;
        }
    }

    clear() {
        if (this.element) {
            document.body.removeChild(this.element);
        }
        this.element = null;
    }
}

function getRows(item: object, options: TooltipOptions) {
    const rows: TableRow[] = [];
    for (let columnName in item) {
        switch (columnName) {
            case FieldNames.Active:
            case FieldNames.Collapsed:
            case FieldNames.Selected:
            case GL_ORDINAL:
                continue;
            default:
                if (options && options.exclude) {
                    if (options.exclude(columnName)) {
                        continue;
                    }
                }
                rows.push({
                    cells: [
                        { content: columnName },
                        { content: item[columnName] }
                    ]
                });
        }
    }
    return rows;
}

const renderTooltip = (props: RenderProps) => {
    return props.rows.length === 0 ? null : (
        <div className={`${props.cssPrefix}tooltip`}>
            {Table({ rows: props.rows })}
        </div>
    );
}
