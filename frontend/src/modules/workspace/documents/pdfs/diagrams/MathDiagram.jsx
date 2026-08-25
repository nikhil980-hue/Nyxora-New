import React from "react";

import {
    Svg,
    Line,
    Circle,
    Path,
    Text,
} from "@react-pdf/renderer";

import NotesFlowchart from "../notes/NotesFlowchart";

function finite(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function safeDimension(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number) && number > 0
        ? number
        : fallback;
}

function safeRange(range, fallbackMin, fallbackMax) {
    const min = finite(range?.[0], fallbackMin);
    const max = finite(range?.[1], fallbackMax);

    if (max <= min) {
        return [fallbackMin, fallbackMax];
    }

    return [min, max];
}

function mapX(value, minX, maxX, width, padding) {
    return (
        padding +
        ((value - minX) / (maxX - minX)) *
            (width - padding * 2)
    );
}

function mapY(value, minY, maxY, height, padding) {
    return (
        height -
        padding -
        ((value - minY) / (maxY - minY)) *
            (height - padding * 2)
    );
}

function createEquationFunction(equation) {
    if (typeof equation === "function") {
        return equation;
    }

    const source = String(equation || "")
        .trim()
        .replace(/^y\s*=\s*/i, "")
        .replace(/\^/g, "**")
        .replace(/\bpi\b/gi, "Math.PI")
        .replace(/\be\b/g, "Math.E")
        .replace(/\bsqrt\s*\(/gi, "Math.sqrt(")
        .replace(/\bsin\s*\(/gi, "Math.sin(")
        .replace(/\bcos\s*\(/gi, "Math.cos(")
        .replace(/\btan\s*\(/gi, "Math.tan(")
        .replace(/\babs\s*\(/gi, "Math.abs(")
        .replace(/\blog\s*\(/gi, "Math.log(")
        .replace(/\bln\s*\(/gi, "Math.log(");

    if (!source) {
        return null;
    }

    if (
        !/^[0-9xXyY+\-*/().,%\s_*a-zA-Z]+$/.test(
            source
        )
    ) {
        return null;
    }

    try {
        const evaluator = new Function(
            "x",
            `return (${source});`
        );

        return (x) => {
            const result = evaluator(x);
            return Number(result);
        };
    } catch {
        return null;
    }
}

function buildFunctionPath({
    equation,
    minX,
    maxX,
    width,
    height,
    padding,
    samples = 180,
}) {
    const equationFunction =
        createEquationFunction(equation);

    if (
        typeof equationFunction !== "function" ||
        samples < 2
    ) {
        return "";
    }

    let path = "";
    let drawing = false;

    for (
        let index = 0;
        index <= samples;
        index += 1
    ) {
        const x =
            minX +
            ((maxX - minX) * index) /
                samples;

        let y;

        try {
            y = Number(
                equationFunction(x)
            );
        } catch {
            y = NaN;
        }

        if (!Number.isFinite(y)) {
            drawing = false;
            continue;
        }

        const px = mapX(
            x,
            minX,
            maxX,
            width,
            padding
        );

        const py = mapY(
            y,
            -10,
            10,
            height,
            padding
        );

        path += drawing
            ? ` L ${px} ${py}`
            : `M ${px} ${py}`;

        drawing = true;
    }

    return path;
}

function CoordinatePlane({
    width = 515,
    height = 260,
    xRange = [-10, 10],
    yRange = [-10, 10],
    points = [],
    lines = [],
    showGrid = true,
    showAxes = true,
    showLabels = true,
}) {
    const safeWidth = safeDimension(
        width,
        515
    );

    const safeHeight = safeDimension(
        height,
        260
    );

    const padding = 28;

    const [minX, maxX] = safeRange(
        xRange,
        -10,
        10
    );

    const [minY, maxY] = safeRange(
        yRange,
        -10,
        10
    );

    const xAxisY =
        minY <= 0 && maxY >= 0
            ? mapY(
                  0,
                  minY,
                  maxY,
                  safeHeight,
                  padding
              )
            : safeHeight - padding;

    const yAxisX =
        minX <= 0 && maxX >= 0
            ? mapX(
                  0,
                  minX,
                  maxX,
                  safeWidth,
                  padding
              )
            : padding;

    const gridLines = [];

    if (showGrid) {
        const xStart = Math.ceil(minX);
        const xEnd = Math.floor(maxX);

        for (
            let x = xStart;
            x <= xEnd;
            x += 1
        ) {
            const px = mapX(
                x,
                minX,
                maxX,
                safeWidth,
                padding
            );

            gridLines.push(
                <Line
                    key={`grid-x-${x}`}
                    x1={px}
                    y1={padding}
                    x2={px}
                    y2={
                        safeHeight -
                        padding
                    }
                    stroke="#E5E7EB"
                    strokeWidth={0.6}
                />
            );
        }

        const yStart = Math.ceil(minY);
        const yEnd = Math.floor(maxY);

        for (
            let y = yStart;
            y <= yEnd;
            y += 1
        ) {
            const py = mapY(
                y,
                minY,
                maxY,
                safeHeight,
                padding
            );

            gridLines.push(
                <Line
                    key={`grid-y-${y}`}
                    x1={padding}
                    y1={py}
                    x2={
                        safeWidth -
                        padding
                    }
                    y2={py}
                    stroke="#E5E7EB"
                    strokeWidth={0.6}
                />
            );
        }
    }

    return (
        <Svg
            width={safeWidth}
            height={safeHeight}
            viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        >
            {gridLines}

            {showAxes && (
                <>
                    <Line
                        x1={padding}
                        y1={xAxisY}
                        x2={
                            safeWidth -
                            padding
                        }
                        y2={xAxisY}
                        stroke="#111827"
                        strokeWidth={1.2}
                    />

                    <Line
                        x1={yAxisX}
                        y1={
                            safeHeight -
                            padding
                        }
                        x2={yAxisX}
                        y2={padding}
                        stroke="#111827"
                        strokeWidth={1.2}
                    />
                </>
            )}

            {lines.map(
                (line, index) => {
                    const x1 = mapX(
                        finite(line?.x1),
                        minX,
                        maxX,
                        safeWidth,
                        padding
                    );

                    const y1 = mapY(
                        finite(line?.y1),
                        minY,
                        maxY,
                        safeHeight,
                        padding
                    );

                    const x2 = mapX(
                        finite(line?.x2),
                        minX,
                        maxX,
                        safeWidth,
                        padding
                    );

                    const y2 = mapY(
                        finite(line?.y2),
                        minY,
                        maxY,
                        safeHeight,
                        padding
                    );

                    return (
                        <Line
                            key={`line-${index}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#6D5DFB"
                            strokeWidth={1.5}
                        />
                    );
                }
            )}

            {points.map(
                (point, index) => {
                    const px = mapX(
                        finite(point?.x),
                        minX,
                        maxX,
                        safeWidth,
                        padding
                    );

                    const py = mapY(
                        finite(point?.y),
                        minY,
                        maxY,
                        safeHeight,
                        padding
                    );

                    return (
                        <React.Fragment
                            key={`point-${index}`}
                        >
                            <Circle
                                cx={px}
                                cy={py}
                                r={3}
                                fill="#6D5DFB"
                            />

                            {showLabels &&
                                point?.label && (
                                    <Text
                                        x={
                                            px +
                                            6
                                        }
                                        y={
                                            py -
                                            6
                                        }
                                        fontSize={9}
                                        fill="#111827"
                                    >
                                        {
                                            point.label
                                        }
                                    </Text>
                                )}
                        </React.Fragment>
                    );
                }
            )}

            {showLabels && (
                <>
                    <Text
                        x={
                            safeWidth -
                            padding +
                            5
                        }
                        y={xAxisY - 5}
                        fontSize={9}
                        fill="#111827"
                    >
                        x
                    </Text>

                    <Text
                        x={yAxisX + 5}
                        y={padding - 5}
                        fontSize={9}
                        fill="#111827"
                    >
                        y
                    </Text>
                </>
            )}
        </Svg>
    );
}

function FunctionGraph({
    width = 515,
    height = 260,
    xRange = [-10, 10],
    yRange = [-10, 10],
    equation,
    points = [],
    showGrid = true,
    showAxes = true,
    showLabels = true,
}) {
    const safeWidth = safeDimension(
        width,
        515
    );

    const safeHeight = safeDimension(
        height,
        260
    );

    const padding = 28;

    const [minX, maxX] = safeRange(
        xRange,
        -10,
        10
    );

    const [minY, maxY] = safeRange(
        yRange,
        -10,
        10
    );

    const xAxisY =
        minY <= 0 && maxY >= 0
            ? mapY(
                  0,
                  minY,
                  maxY,
                  safeHeight,
                  padding
              )
            : safeHeight - padding;

    const yAxisX =
        minX <= 0 && maxX >= 0
            ? mapX(
                  0,
                  minX,
                  maxX,
                  safeWidth,
                  padding
              )
            : padding;

    const gridLines = [];

    if (showGrid) {
        for (
            let x = Math.ceil(minX);
            x <= Math.floor(maxX);
            x += 1
        ) {
            const px = mapX(
                x,
                minX,
                maxX,
                safeWidth,
                padding
            );

            gridLines.push(
                <Line
                    key={`function-grid-x-${x}`}
                    x1={px}
                    y1={padding}
                    x2={px}
                    y2={
                        safeHeight -
                        padding
                    }
                    stroke="#E5E7EB"
                    strokeWidth={0.6}
                />
            );
        }

        for (
            let y = Math.ceil(minY);
            y <= Math.floor(maxY);
            y += 1
        ) {
            const py = mapY(
                y,
                minY,
                maxY,
                safeHeight,
                padding
            );

            gridLines.push(
                <Line
                    key={`function-grid-y-${y}`}
                    x1={padding}
                    y1={py}
                    x2={
                        safeWidth -
                        padding
                    }
                    y2={py}
                    stroke="#E5E7EB"
                    strokeWidth={0.6}
                />
            );
        }
    }

    const path = buildFunctionPath({
        equation,
        minX,
        maxX,
        safeWidth,
        safeHeight,
        padding,
        samples: 220,
    });

    return (
        <Svg
            width={safeWidth}
            height={safeHeight}
            viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        >
            {gridLines}

            {showAxes && (
                <>
                    <Line
                        x1={padding}
                        y1={xAxisY}
                        x2={
                            safeWidth -
                            padding
                        }
                        y2={xAxisY}
                        stroke="#111827"
                        strokeWidth={1.2}
                    />

                    <Line
                        x1={yAxisX}
                        y1={
                            safeHeight -
                            padding
                        }
                        x2={yAxisX}
                        y2={padding}
                        stroke="#111827"
                        strokeWidth={1.2}
                    />
                </>
            )}

            {path && (
                <Path
                    d={path}
                    fill="none"
                    stroke="#6D5DFB"
                    strokeWidth={2}
                />
            )}

            {points.map(
                (point, index) => {
                    const px = mapX(
                        finite(point?.x),
                        minX,
                        maxX,
                        safeWidth,
                        padding
                    );

                    const py = mapY(
                        finite(point?.y),
                        minY,
                        maxY,
                        safeHeight,
                        padding
                    );

                    return (
                        <React.Fragment
                            key={`function-point-${index}`}
                        >
                            <Circle
                                cx={px}
                                cy={py}
                                r={3}
                                fill="#6D5DFB"
                            />

                            {showLabels &&
                                point?.label && (
                                    <Text
                                        x={
                                            px +
                                            6
                                        }
                                        y={
                                            py -
                                            6
                                        }
                                        fontSize={9}
                                        fill="#111827"
                                    >
                                        {
                                            point.label
                                        }
                                    </Text>
                                )}
                        </React.Fragment>
                    );
                }
            )}

            {showLabels && (
                <>
                    <Text
                        x={
                            safeWidth -
                            padding +
                            5
                        }
                        y={xAxisY - 5}
                        fontSize={9}
                        fill="#111827"
                    >
                        x
                    </Text>

                    <Text
                        x={yAxisX + 5}
                        y={padding - 5}
                        fontSize={9}
                        fill="#111827"
                    >
                        y
                    </Text>
                </>
            )}
        </Svg>
    );
}
function mapDiagramPoint(
    point,
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    padding
) {
    return {
        x: mapX(
            finite(point?.x),
            minX,
            maxX,
            width,
            padding
        ),
        y: mapY(
            finite(point?.y),
            minY,
            maxY,
            height,
            padding
        ),
    };
}

function GeometryLabels({
    points = [],
    showLabels = true,
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    padding,
}) {
    if (!showLabels) {
        return null;
    }

    return (
        <>
            {points.map(
                (point, index) => {
                    const mapped =
                        mapDiagramPoint(
                            point,
                            minX,
                            maxX,
                            minY,
                            maxY,
                            width,
                            height,
                            padding
                        );

                    const normalizedLabel =
                        normalizeDiagramLabelText(
                            point?.label
                        );

                    return normalizedLabel ? (
                        <Text
                            key={`geometry-label-${index}`}
                            x={mapped.x + 7}
                            y={mapped.y - 7}
                            fontSize={10}
                            fill="#111827"
                        >
                            {normalizedLabel}
                        </Text>
                    ) : null;
                }
            )}
        </>
    );
}

function GeometryDiagram({
    type,
    width = 515,
    height = 260,
    xRange = [-10, 10],
    yRange = [-10, 10],
    points = [],
    lines = [],
    showLabels = true,
    center = { x: 0, y: 0 },
    radius = 5,
    vertex = { x: 0, y: 0 },
    arm1 = { x: 4, y: 0 },
    arm2 = { x: 2, y: 3 },
    angleLabel = "",
}) {
    const safeWidth = safeDimension(
        width,
        515
    );

    const safeHeight = safeDimension(
        height,
        260
    );

    const padding = 28;

    const [minX, maxX] = safeRange(
        xRange,
        -10,
        10
    );

    const [minY, maxY] = safeRange(
        yRange,
        -10,
        10
    );

    const mappedPoints = points.map(
        (point) =>
            mapDiagramPoint(
                point,
                minX,
                maxX,
                minY,
                maxY,
                safeWidth,
                safeHeight,
                padding
            )
    );

    const renderLine = (
        line,
        index
    ) => {
        let first = line;
        let second = null;

        if (
            Array.isArray(line?.points) &&
            line.points.length >= 2
        ) {
            first = line.points[0];
            second = line.points[1];
        }

        if (!second) {
            second = {
                x: line?.x2,
                y: line?.y2,
            };

            first = {
                x: line?.x1,
                y: line?.y1,
            };
        }

        const start =
            mapDiagramPoint(
                first,
                minX,
                maxX,
                minY,
                maxY,
                safeWidth,
                safeHeight,
                padding
            );

        const end =
            mapDiagramPoint(
                second,
                minX,
                maxX,
                minY,
                maxY,
                safeWidth,
                safeHeight,
                padding
            );

        return (
            <Line
                key={`geometry-line-${index}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#6D5DFB"
                strokeWidth={1.8}
            />
        );
    };

    const renderPolygon = (
        polygonPoints,
        closePath = true
    ) => {
        if (
            !Array.isArray(
                polygonPoints
            ) ||
            polygonPoints.length < 2
        ) {
            return null;
        }

        const mapped =
            polygonPoints.map(
                (point) =>
                    mapDiagramPoint(
                        point,
                        minX,
                        maxX,
                        minY,
                        maxY,
                        safeWidth,
                        safeHeight,
                        padding
                    )
            );

        const first = mapped[0];

        const commands = [
            `M ${first.x} ${first.y}`,
        ];

        mapped
            .slice(1)
            .forEach((point) => {
                commands.push(
                    `L ${point.x} ${point.y}`
                );
            });

        if (closePath) {
            commands.push("Z");
        }

        return (
            <Path
                d={commands.join(" ")}
                fill="none"
                stroke="#6D5DFB"
                strokeWidth={1.8}
            />
        );
    };

    const renderAngle = () => {
        const mappedVertex =
            mapDiagramPoint(
                vertex,
                minX,
                maxX,
                minY,
                maxY,
                safeWidth,
                safeHeight,
                padding
            );

        const mappedArm1 =
            mapDiagramPoint(
                arm1,
                minX,
                maxX,
                minY,
                maxY,
                safeWidth,
                safeHeight,
                padding
            );

        const mappedArm2 =
            mapDiagramPoint(
                arm2,
                minX,
                maxX,
                minY,
                maxY,
                safeWidth,
                safeHeight,
                padding
            );

        const {
            angle1,
            delta,
        } =
            angleBetweenPoints(
                mappedVertex,
                mappedArm1,
                mappedArm2
            );

        const angleLabelRadius = 18;

        const labelAngle =
            angle1 + delta / 2;

        const labelX =
            mappedVertex.x +
            angleLabelRadius *
                Math.cos(labelAngle);

        const labelY =
            mappedVertex.y +
            angleLabelRadius *
                Math.sin(labelAngle);

        return (
            <>
                <Line
                    x1={mappedVertex.x}
                    y1={mappedVertex.y}
                    x2={mappedArm1.x}
                    y2={mappedArm1.y}
                    stroke="#6D5DFB"
                    strokeWidth={1.8}
                />

                <Line
                    x1={mappedVertex.x}
                    y1={mappedVertex.y}
                    x2={mappedArm2.x}
                    y2={mappedArm2.y}
                    stroke="#6D5DFB"
                    strokeWidth={1.8}
                />

                {showLabels &&
                    vertex?.label && (
                        <Text
                            x={
                                mappedVertex.x +
                                6
                            }
                            y={
                                mappedVertex.y -
                                6
                            }
                            fontSize={10}
                            fill="#111827"
                        >
                            {normalizeDiagramLabelText(vertex.label)}
                        </Text>
                    )}

                {showLabels &&
                    arm1?.label && (
                        <Text
                            x={
                                mappedArm1.x +
                                6
                            }
                            y={
                                mappedArm1.y -
                                6
                            }
                            fontSize={10}
                            fill="#111827"
                        >
                            {normalizeDiagramLabelText(arm1.label)}
                        </Text>
                    )}

                {showLabels &&
                    arm2?.label && (
                        <Text
                            x={
                                mappedArm2.x +
                                6
                            }
                            y={
                                mappedArm2.y -
                                6
                            }
                            fontSize={10}
                            fill="#111827"
                        >
                            {normalizeDiagramLabelText(arm2.label)}
                        </Text>
                    )}

                {angleLabel && (
                    <>
                        <Path
                            d={(() => {
                                const radius = 13;
                                const steps = 18;
                                const points = [];

                                for (
                                    let index = 0;
                                    index <= steps;
                                    index += 1
                                ) {
                                    const t =
                                        index / steps;

                                    const currentAngle =
                                        angle1 +
                                        delta * t;

                                    points.push(
                                        `${mappedVertex.x + radius * Math.cos(currentAngle)} ${mappedVertex.y + radius * Math.sin(currentAngle)}`
                                    );
                                }

                                return points.length
                                    ? `M ${points[0]} ` +
                                      points
                                          .slice(1)
                                          .map(
                                              point =>
                                                  `L ${point}`
                                          )
                                          .join(" ")
                                    : "";
                            })()}
                            fill="none"
                            stroke="#111827"
                            strokeWidth={1.2}
                        />

                        {showLabels && (
                            <Text
                                x={labelX}
                                y={labelY}
                                fontSize={10}
                                fill="#111827"
                            >
                                {angleLabel}
                            </Text>
                        )}
                    </>
                )}
            </>
        );
    };

    const mappedCenter =
        mapDiagramPoint(
            center,
            minX,
            maxX,
            minY,
            maxY,
            safeWidth,
            safeHeight,
            padding
        );

    const radiusX =
        (finite(radius, 5) /
            (maxX - minX)) *
        (safeWidth - padding * 2);

    const radiusY =
        (finite(radius, 5) /
            (maxY - minY)) *
        (safeHeight - padding * 2);

    return (
        <Svg
            width={safeWidth}
            height={safeHeight}
            viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        >
            {type === "triangle" &&
                renderPolygon(points)}

            {type === "rectangle" &&
                renderPolygon(points)}

            {type === "square" &&
                renderPolygon(points)}

            {type === "line" &&
                lines.map(renderLine)}

            {type === "line" &&
                lines.length === 0 &&
                points.length >= 2 &&
                renderPolygon(
                    points,
                    false
                )}

            {type === "circle" && (
                <Circle
                    cx={mappedCenter.x}
                    cy={mappedCenter.y}
                    r={Math.max(
                        2,
                        Math.min(
                            radiusX,
                            radiusY
                        )
                    )}
                    fill="none"
                    stroke="#6D5DFB"
                    strokeWidth={1.8}
                />
            )}

            {/* Angle arc/marking rendering intentionally disabled. */}

            {mappedPoints.map(
                (point, index) => (
                    <React.Fragment
                        key={`geometry-point-${index}`}
                    >
                        <Circle
                            cx={point.x}
                            cy={point.y}
                            r={3}
                            fill="#6D5DFB"
                        />
                    </React.Fragment>
                )
            )}

            <GeometryLabels
                points={points}
                showLabels={showLabels}
                minX={minX}
                maxX={maxX}
                minY={minY}
                maxY={maxY}
                width={safeWidth}
                height={safeHeight}
                padding={padding}
            />
        </Svg>
    );
}

/* ======================================================
   ASCII → VECTOR DIAGRAM
   ====================================================== */

function ASCIIDiagram({
    ascii = "",
    width = 515,
    height = 260,
}) {
    const safeWidth = safeDimension(width, 515);
    const safeHeight = safeDimension(height, 260);

    const source = String(ascii || "")
        .replace(/\r/g, "")
        .replace(/```(?:text|txt)?/gi, "")
        .replace(/```/g, "")
        .trim();

    if (!source) {
        return null;
    }

    const rows = source.split("\n");

    while (
        rows.length &&
        !rows[0].trim()
    ) {
        rows.shift();
    }

    while (
        rows.length &&
        !rows[rows.length - 1].trim()
    ) {
        rows.pop();
    }

    if (!rows.length) {
        return null;
    }

    const rowCount = rows.length;

    const columnCount = Math.max(
        ...rows.map(row => row.length),
        1
    );

    const paddingX = 25;
    const paddingY = 20;

    const cellWidth =
        (safeWidth - paddingX * 2) /
        Math.max(columnCount, 1);

    const cellHeight =
        (safeHeight - paddingY * 2) /
        Math.max(rowCount, 1);

    const elements = [];

    const getChar = (
        row,
        column
    ) => {
        if (
            row < 0 ||
            row >= rowCount ||
            column < 0 ||
            column >= rows[row].length
        ) {
            return " ";
        }

        return rows[row][column];
    };

    const getPoint = (
        row,
        column
    ) => ({
        x:
            paddingX +
            column * cellWidth +
            cellWidth / 2,

        y:
            paddingY +
            row * cellHeight +
            cellHeight / 2,
    });

    const horizontalChars =
        new Set([
            "-",
            "_",
            "─",
            "━",
            "═",
        ]);

    const verticalChars =
        new Set([
            "|",
            "│",
            "┃",
            "║",
        ]);

    const diagonalDownChars =
        new Set([
            "\\",
            "＼",
            "╲",
        ]);

    const diagonalUpChars =
        new Set([
            "/",
            "／",
            "╱",
        ]);

    const junctionChars =
        new Set([
            "+",
            "┼",
            "╋",
            "├",
            "┤",
            "┬",
            "┴",
            "┌",
            "┐",
            "└",
            "┘",
        ]);

    const arrowChars =
        new Set([
            "→",
            "←",
            "↑",
            "↓",
            "↔",
            "↕",
        ]);

    const isGeometryChar = char =>
        horizontalChars.has(char) ||
        verticalChars.has(char) ||
        diagonalDownChars.has(char) ||
        diagonalUpChars.has(char) ||
        junctionChars.has(char) ||
        arrowChars.has(char);

    const addLine = (
        key,
        x1,
        y1,
        x2,
        y2,
        strokeWidth = 1.6
    ) => {
        elements.push(
            <Line
                key={key}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#111827"
                strokeWidth={strokeWidth}
            />
        );
    };

    /*
     * Horizontal geometry
     *
     * Instead of drawing one tiny line for every "-",
     * collect consecutive horizontal characters into
     * one continuous vector.
     */
    rows.forEach(
        (row, rowIndex) => {
            let start = -1;

            for (
                let column = 0;
                column <= columnCount;
                column += 1
            ) {
                const char =
                    column < columnCount
                        ? getChar(
                              rowIndex,
                              column
                          )
                        : " ";

                const horizontal =
                    horizontalChars.has(char);

                if (
                    horizontal &&
                    start === -1
                ) {
                    start = column;
                }

                if (
                    !horizontal &&
                    start !== -1
                ) {
                    const end =
                        column - 1;

                    const left =
                        getPoint(
                            rowIndex,
                            start
                        );

                    const right =
                        getPoint(
                            rowIndex,
                            end
                        );

                    addLine(
                        `ascii-horizontal-${rowIndex}-${start}`,
                        left.x -
                            cellWidth / 2,
                        left.y,
                        right.x +
                            cellWidth / 2,
                        right.y
                    );

                    start = -1;
                }
            }
        }
    );

    /*
     * Vertical geometry
     *
     * Collect consecutive "|" characters into
     * one continuous vector.
     */
    for (
        let column = 0;
        column < columnCount;
        column += 1
    ) {
        let start = -1;

        for (
            let rowIndex = 0;
            rowIndex <= rowCount;
            rowIndex += 1
        ) {
            const char =
                rowIndex < rowCount
                    ? getChar(
                          rowIndex,
                          column
                      )
                    : " ";

            const vertical =
                verticalChars.has(char);

            if (
                vertical &&
                start === -1
            ) {
                start = rowIndex;
            }

            if (
                !vertical &&
                start !== -1
            ) {
                const end =
                    rowIndex - 1;

                const top =
                    getPoint(
                        start,
                        column
                    );

                const bottom =
                    getPoint(
                        end,
                        column
                    );

                addLine(
                    `ascii-vertical-${column}-${start}`,
                    top.x,
                    top.y -
                        cellHeight / 2,
                    bottom.x,
                    bottom.y +
                        cellHeight / 2
                );

                start = -1;
            }
        }
    }

    /*
     * Diagonal geometry.
     *
     * Each diagonal character is connected to
     * the next diagonal character in the same
     * direction.
     */
    rows.forEach(
        (row, rowIndex) => {
            for (
                let column = 0;
                column < columnCount;
                column += 1
            ) {
                const char =
                    getChar(
                        rowIndex,
                        column
                    );

                /*
                 * \
                 */
                if (
                    diagonalDownChars.has(
                        char
                    )
                ) {
                    const next =
                        getChar(
                            rowIndex + 1,
                            column + 1
                        );

                    if (
                        diagonalDownChars.has(
                            next
                        )
                    ) {
                        const start =
                            getPoint(
                                rowIndex,
                                column
                            );

                        const end =
                            getPoint(
                                rowIndex + 1,
                                column + 1
                            );

                        addLine(
                            `ascii-diagonal-down-${rowIndex}-${column}`,
                            start.x -
                                cellWidth / 2,
                            start.y -
                                cellHeight / 2,
                            end.x +
                                cellWidth / 2,
                            end.y +
                                cellHeight / 2
                        );
                    }
                }

                /*
                 * /
                 */
                if (
                    diagonalUpChars.has(
                        char
                    )
                ) {
                    const next =
                        getChar(
                            rowIndex + 1,
                            column - 1
                        );

                    if (
                        diagonalUpChars.has(
                            next
                        )
                    ) {
                        const start =
                            getPoint(
                                rowIndex,
                                column
                            );

                        const end =
                            getPoint(
                                rowIndex + 1,
                                column - 1
                            );

                        addLine(
                            `ascii-diagonal-up-${rowIndex}-${column}`,
                            start.x +
                                cellWidth / 2,
                            start.y -
                                cellHeight / 2,
                            end.x -
                                cellWidth / 2,
                            end.y +
                                cellHeight / 2
                        );
                    }
                }
            }
        }
    );

    /*
     * Junctions.
     *
     * Draw a small vector intersection so
     * corners and crossings don't disappear.
     */
    rows.forEach(
        (row, rowIndex) => {
            for (
                let column = 0;
                column < columnCount;
                column += 1
            ) {
                const char =
                    getChar(
                        rowIndex,
                        column
                    );

                if (
                    !junctionChars.has(
                        char
                    )
                ) {
                    continue;
                }

                const point =
                    getPoint(
                        rowIndex,
                        column
                    );

                const radius =
                    Math.min(
                        cellWidth,
                        cellHeight
                    ) * 0.35;

                addLine(
                    `ascii-junction-h-${rowIndex}-${column}`,
                    point.x - radius,
                    point.y,
                    point.x + radius,
                    point.y,
                    1.7
                );

                addLine(
                    `ascii-junction-v-${rowIndex}-${column}`,
                    point.x,
                    point.y - radius,
                    point.x,
                    point.y + radius,
                    1.7
                );
            }
        }
    );

    /*
     * Arrows.
     *
     * Render the shaft as a vector and the
     * arrowhead as two short vectors.
     */
    rows.forEach(
        (row, rowIndex) => {
            for (
                let column = 0;
                column < columnCount;
                column += 1
            ) {
                const char =
                    getChar(
                        rowIndex,
                        column
                    );

                if (
                    !arrowChars.has(
                        char
                    )
                ) {
                    continue;
                }

                const point =
                    getPoint(
                        rowIndex,
                        column
                    );

                const size =
                    Math.min(
                        cellWidth,
                        cellHeight
                    ) * 0.45;

                if (char === "→") {
                    addLine(
                        `arrow-right-${rowIndex}-${column}`,
                        point.x - size,
                        point.y,
                        point.x + size,
                        point.y
                    );

                    addLine(
                        `arrow-right-a-${rowIndex}-${column}`,
                        point.x + size,
                        point.y,
                        point.x + size - 4,
                        point.y - 4
                    );

                    addLine(
                        `arrow-right-b-${rowIndex}-${column}`,
                        point.x + size,
                        point.y,
                        point.x + size - 4,
                        point.y + 4
                    );
                }

                if (char === "←") {
                    addLine(
                        `arrow-left-${rowIndex}-${column}`,
                        point.x - size,
                        point.y,
                        point.x + size,
                        point.y
                    );

                    addLine(
                        `arrow-left-a-${rowIndex}-${column}`,
                        point.x - size,
                        point.y,
                        point.x - size + 4,
                        point.y - 4
                    );

                    addLine(
                        `arrow-left-b-${rowIndex}-${column}`,
                        point.x - size,
                        point.y,
                        point.x - size + 4,
                        point.y + 4
                    );
                }

                if (char === "↑") {
                    addLine(
                        `arrow-up-${rowIndex}-${column}`,
                        point.x,
                        point.y + size,
                        point.x,
                        point.y - size
                    );

                    addLine(
                        `arrow-up-a-${rowIndex}-${column}`,
                        point.x,
                        point.y - size,
                        point.x - 4,
                        point.y - size + 4
                    );

                    addLine(
                        `arrow-up-b-${rowIndex}-${column}`,
                        point.x,
                        point.y - size,
                        point.x + 4,
                        point.y - size + 4
                    );
                }

                if (char === "↓") {
                    addLine(
                        `arrow-down-${rowIndex}-${column}`,
                        point.x,
                        point.y - size,
                        point.x,
                        point.y + size
                    );

                    addLine(
                        `arrow-down-a-${rowIndex}-${column}`,
                        point.x,
                        point.y + size,
                        point.x - 4,
                        point.y + size - 4
                    );

                    addLine(
                        `arrow-down-b-${rowIndex}-${column}`,
                        point.x,
                        point.y + size,
                        point.x + 4,
                        point.y + size - 4
                    );
                }
            }
        }
    );

    /*
     * Labels.
     *
     * Only render non-geometry characters.
     * This preserves A, B, C, O, P, Q, dimensions,
     * angle names, etc.
     */
    rows.forEach(
        (row, rowIndex) => {
            for (
                let column = 0;
                column < row.length;
                column += 1
            ) {
                const char =
                    getChar(
                        rowIndex,
                        column
                    );

                if (
                    !char ||
                    char.trim() === "" ||
                    isGeometryChar(char)
                ) {
                    continue;
                }

                const point =
                    getPoint(
                        rowIndex,
                        column
                    );

                elements.push(
                    <Text
                        key={`ascii-label-${rowIndex}-${column}`}
                        x={
                            point.x - 3
                        }
                        y={
                            point.y + 3
                        }
                        fontSize={9}
                        fill="#111827"
                    >
                        {char}
                    </Text>
                );
            }
        }
    );

    return (
        <Svg
            width={safeWidth}
            height={safeHeight}
            viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        >
            {elements}
        </Svg>
    );
}

/* ======================================================
   UNIVERSAL VECTOR SCENE
   ====================================================== */

function normalizeSceneStyle(style = {}) {
    return {
        stroke: style?.stroke || "#111827",
        fill:
            style?.fill === undefined ||
            style?.fill === null ||
            style?.fill === ""
                ? "none"
                : style.fill,
        strokeWidth: Math.max(
            0.1,
            finite(style?.strokeWidth, 1.5)
        ),
        opacity: Math.min(
            1,
            Math.max(
                0,
                finite(style?.opacity, 1)
            )
        ),
    };
}

function scenePoint(
    point = {},
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    padding
) {
    return mapDiagramPoint(
        point,
        minX,
        maxX,
        minY,
        maxY,
        width,
        height,
        padding
    );
}

function renderSceneArrow(
    x1,
    y1,
    x2,
    y2,
    style = {},
    endArrow = true,
    key = "scene-arrow"
) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (!length) {
        return null;
    }

    const ux = dx / length;
    const uy = dy / length;
    const size = 7;
    const px = -uy;
    const py = ux;
    const s = normalizeSceneStyle(style);

    return (
        <React.Fragment key={key}>
            <Line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                opacity={s.opacity}
            />

            {endArrow && (
                <>
                    <Line
                        x1={x2}
                        y1={y2}
                        x2={
                            x2 -
                            ux * size +
                            px * size * 0.55
                        }
                        y2={
                            y2 -
                            uy * size +
                            py * size * 0.55
                        }
                        stroke={s.stroke}
                        strokeWidth={s.strokeWidth}
                        opacity={s.opacity}
                    />

                    <Line
                        x1={x2}
                        y1={y2}
                        x2={
                            x2 -
                            ux * size -
                            px * size * 0.55
                        }
                        y2={
                            y2 -
                            uy * size -
                            py * size * 0.55
                        }
                        stroke={s.stroke}
                        strokeWidth={s.strokeWidth}
                        opacity={s.opacity}
                    />
                </>
            )}
        </React.Fragment>
    );
}

function buildSceneCurvePath({
    equation,
    xRange,
    yRange,
    width,
    height,
    padding,
    samples = 240,
}) {
    const fn = createEquationFunction(equation);

    if (!fn) {
        return "";
    }

    const [minX, maxX] = xRange;
    const [minY, maxY] = yRange;

    let path = "";
    let drawing = false;

    for (let i = 0; i <= samples; i += 1) {
        const x =
            minX +
            ((maxX - minX) * i) /
                samples;

        let y;

        try {
            y = Number(fn(x));
        } catch {
            y = NaN;
        }

        if (
            !Number.isFinite(y) ||
            y < minY - (maxY - minY) * 2 ||
            y > maxY + (maxY - minY) * 2
        ) {
            drawing = false;
            continue;
        }

        const px = mapX(
            x,
            minX,
            maxX,
            width,
            padding
        );

        const py = mapY(
            y,
            minY,
            maxY,
            height,
            padding
        );

        path += drawing
            ? ` L ${px} ${py}`
            : `M ${px} ${py}`;

        drawing = true;
    }

    return path;
}

function buildSceneArcPath({
    cx,
    cy,
    radius,
    startAngle,
    endAngle,
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    padding,
}) {
    const steps = Math.max(
        12,
        Math.ceil(
            Math.abs(
                endAngle - startAngle
            ) / 8
        )
    );

    const points = [];

    for (
        let i = 0;
        i <= steps;
        i += 1
    ) {
        const angle =
            startAngle +
            ((endAngle - startAngle) *
                i) /
                steps;

        const radians =
            (angle * Math.PI) / 180;

        points.push(
            scenePoint(
                {
                    x:
                        cx +
                        radius *
                            Math.cos(
                                radians
                            ),
                    y:
                        cy +
                        radius *
                            Math.sin(
                                radians
                            ),
                },
                minX,
                maxX,
                minY,
                maxY,
                width,
                height,
                padding
            )
        );
    }

    if (!points.length) {
        return "";
    }

    return (
        `M ${points[0].x} ${points[0].y} ` +
        points
            .slice(1)
            .map(
                point =>
                    `L ${point.x} ${point.y}`
            )
            .join(" ")
    );
}

function getSceneObjectId(object, fallbackIndex) {
    if (object?.id !== undefined && object?.id !== null) {
        return String(object.id);
    }

    if (object?.name !== undefined && object?.name !== null) {
        return String(object.name);
    }

    if (object?.label !== undefined && object?.label !== null) {
        return String(object.label);
    }

    return String(fallbackIndex);
}

function findScenePoint(points = [], reference) {
    if (reference === undefined || reference === null) {
        return null;
    }

    const wanted = String(reference);

    return (
        points.find((point, index) =>
            getSceneObjectId(point, index) === wanted
        ) || null
    );
}

function findSceneLine(lines = [], reference) {
    if (reference === undefined || reference === null) {
        return null;
    }

    const wanted = String(reference);

    return (
        lines.find((line, index) =>
            getSceneObjectId(line, index) === wanted
        ) || null
    );
}

function findSceneCircle(circles = [], reference) {
    if (reference === undefined || reference === null) {
        return null;
    }

    const wanted = String(reference);

    return (
        circles.find((circle, index) =>
            getSceneObjectId(circle, index) === wanted
        ) || null
    );
}


function normalizeDiagramLabelText(text = "") {
    const value = String(text || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!value) {
        return "";
    }

    /*
     * Point/geometry labels produced by the AI often arrive as:
     *   A (Top)
     *   B (Base)
     *   O (Center)
     *   C (Ship 2)
     *   Radius (r)
     *   Diameter (d)
     *   String (L)
     *
     * Keep only the actual mathematical symbol/point identifier.
     */
    let match = value.match(
        /^([A-Za-z])\s*\([^()]*\)$/u
    );

    if (match) {
        return match[1];
    }

    match = value.match(
        /^.*\(\s*([A-Za-z])\s*\)$/u
    );

    if (match) {
        return match[1];
    }

    /*
     * Never allow descriptive prose to become a diagram label.
     * Mathematical annotations such as 60 m, 45°, x, AD = ?,
     * 2r, etc. remain untouched.
     */
    const isMathematicalAnnotation =
        /[\d°=<>≤≥+\-×÷*/√^_?]/u.test(value) ||
        /^[A-Za-z]{1,4}$/u.test(value);

    if (isMathematicalAnnotation) {
        return value;
    }

    return "";
}


function shouldSuppressUniversalLabel(label, text = "") {
    const value = String(text || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!value) {
        return true;
    }

    const attachedType = String(
        label?.attachedTo?.type ??
        label?.type ??
        label?.kind ??
        label?.role ??
        label?.category ??
        ""
    ).toLowerCase();

    const metadata = [
        label?.id,
        label?.name,
        label?.key,
        label?.attachedTo?.id,
        label?.attachedTo?.name,
    ]
        .filter(
            item =>
                item !== undefined &&
                item !== null
        )
        .map(item => String(item).toLowerCase())
        .join(" ");

    /*
     * Renderer policy:
     * - Never render angle values/names.
     * - Never render angle/dimension metadata.
     * - Never render measurement values such as "5 cm".
     * - Never render standalone numeric dimension values.
     *
     * Point identifiers such as A, B, C remain unaffected.
     */
    const isAngleLabel =
        attachedType.includes("angle") ||
        metadata.includes("angle") ||
        /^\s*(?:∠|angle\b)/iu.test(value) ||
        /^\s*\d+(?:\.\d+)?\s*°\s*$/u.test(value);

    if (isAngleLabel) {
        return true;
    }

    const isDimensionLabel =
        attachedType.includes("dimension") ||
        attachedType.includes("measurement") ||
        attachedType.includes("measure") ||
        metadata.includes("dimension") ||
        metadata.includes("measurement") ||
        /\b(?:dimension|measurement)\b/iu.test(value);

    if (isDimensionLabel) {
        return true;
    }

    /*
     * Explicitly suppress common measurement labels.
     * This covers values such as:
     *   5 cm
     *   12.5 cm
     *   5cm
     */
    if (
        /^\s*(?:\d+(?:\.\d+)?)\s*cm\s*$/iu.test(
            value
        )
    ) {
        return true;
    }

    /*
     * Suppress dimension-style equations/annotations:
     *   AB = 5 cm
     *   5 cm
     *   12
     *
     * Single alphabetic point labels are intentionally kept.
     */
    if (
        /\b\d+(?:\.\d+)?\s*cm\b/iu.test(
            value
        )
    ) {
        return true;
    }

    if (
        /^\s*\d+(?:\.\d+)?\s*$/u.test(
            value
        )
    ) {
        return true;
    }

    return false;
}

function pointIdentifier(point, index) {
    if (!point) {
        return String(index);
    }

    return String(
        point?.id ??
        point?.label ??
        point?.name ??
        index
    );
}

function findScenePointFlexible(points = [], reference) {
    if (
        reference === undefined ||
        reference === null
    ) {
        return null;
    }

    const wanted = String(reference)
        .trim();

    const direct = findScenePoint(
        points,
        wanted
    );

    if (direct) {
        return direct;
    }

    const normalizedWanted =
        wanted
            .replace(/^\s+|\s+$/g, "")
            .replace(/[()]/g, "");

    return (
        points.find((point, index) => {
            const candidates = [
                point?.id,
                point?.label,
                point?.name,
                index,
            ]
                .filter(
                    item =>
                        item !== undefined &&
                        item !== null
                )
                .map(item =>
                    String(item)
                        .trim()
                        .replace(/[()]/g, "")
                );

            return candidates.includes(
                normalizedWanted
            );
        }) || null
    );
}

function findSceneLineFlexible(
    lines = [],
    points = [],
    reference
) {
    if (
        reference === undefined ||
        reference === null
    ) {
        return null;
    }

    const wanted = String(reference)
        .trim();

    const direct = findSceneLine(
        lines,
        wanted
    );

    if (direct) {
        return direct;
    }

    /*
     * Also accept conventional geometry references:
     *   AB
     *   AC
     *   line-AB
     *   A-B
     */
    const cleaned = wanted
        .replace(/^line[-_:]?/i, "")
        .replace(/[\s()]/g, "");

    const pairMatch =
        cleaned.match(
            /^([A-Za-z][A-Za-z0-9]*)[-:>]([A-Za-z][A-Za-z0-9]*)$/u
        ) ||
        cleaned.match(
            /^([A-Za-z])([A-Za-z])$/u
        );

    if (!pairMatch) {
        return null;
    }

    const fromId = pairMatch[1];
    const toId = pairMatch[2];

    return (
        lines.find(line => {
            if (
                line?.from !== undefined &&
                line?.to !== undefined
            ) {
                const from = findScenePointFlexible(
                    points,
                    line.from
                );

                const to = findScenePointFlexible(
                    points,
                    line.to
                );

                if (!from || !to) {
                    return false;
                }

                const fromKey =
                    pointIdentifier(from, 0);

                const toKey =
                    pointIdentifier(to, 0);

                return (
                    (
                        fromKey === fromId &&
                        toKey === toId
                    ) ||
                    (
                        fromKey === toId &&
                        toKey === fromId
                    ) ||
                    (
                        String(from?.label || "")
                            .trim() === fromId &&
                        String(to?.label || "")
                            .trim() === toId
                    ) ||
                    (
                        String(from?.label || "")
                            .trim() === toId &&
                        String(to?.label || "")
                            .trim() === fromId
                    )
                );
            }

            return false;
        }) || null
    );
}

function resolveAngleRayEndpoint(
    line,
    vertex,
    points = []
) {
    const endpoints =
        resolveSceneLineEndpoints(
            line,
            points
        );

    if (!endpoints) {
        return null;
    }

    const startDistance =
        distanceSquared(
            endpoints.start,
            vertex
        );

    const endDistance =
        distanceSquared(
            endpoints.end,
            vertex
        );

    /*
     * The endpoint nearest to the vertex is the
     * vertex itself. The other endpoint is the ray.
     *
     * If the AI supplied slightly imperfect coordinates,
     * still use the farther endpoint so the angle is
     * determined by the intended line.
     */
    return startDistance >= endDistance
        ? endpoints.start
        : endpoints.end;
}

function angleBetweenPoints(
    vertex,
    ray1,
    ray2
) {
    const a1 = Math.atan2(
        ray1.y - vertex.y,
        ray1.x - vertex.x
    );

    const a2 = Math.atan2(
        ray2.y - vertex.y,
        ray2.x - vertex.x
    );

    let delta =
        ((a2 - a1 + Math.PI) %
            (Math.PI * 2)) -
        Math.PI;

    if (delta === -Math.PI) {
        delta = Math.PI;
    }

    return {
        angle1: a1,
        angle2: a2,
        delta,
    };
}

function pointToSegmentDistanceSquared(
    point,
    segmentStart,
    segmentEnd
) {
    const px = Number(point?.x || 0);
    const py = Number(point?.y || 0);
    const ax = Number(segmentStart?.x || 0);
    const ay = Number(segmentStart?.y || 0);
    const bx = Number(segmentEnd?.x || 0);
    const by = Number(segmentEnd?.y || 0);

    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared =
        dx * dx + dy * dy;

    if (!lengthSquared) {
        return (
            (px - ax) * (px - ax) +
            (py - ay) * (py - ay)
        );
    }

    const t = Math.max(
        0,
        Math.min(
            1,
            ((px - ax) * dx +
                (py - ay) * dy) /
                lengthSquared
        )
    );

    const closestX =
        ax + t * dx;
    const closestY =
        ay + t * dy;

    const distanceX =
        px - closestX;
    const distanceY =
        py - closestY;

    return (
        distanceX * distanceX +
        distanceY * distanceY
    );
}

function resolvePointLabelPosition({
    point,
    points = [],
    lines = [],
    mapPoint,
}) {
    const mapped = mapPoint(point);

    const connectedSegments = [];

    lines.forEach(line => {
        const endpoints =
            resolveSceneLineEndpoints(
                line,
                points
            );

        if (!endpoints) {
            return;
        }

        const startDistance =
            distanceSquared(
                endpoints.start,
                point
            );

        const endDistance =
            distanceSquared(
                endpoints.end,
                point
            );

        const tolerance = 0.35;

        if (
            startDistance <=
            tolerance * tolerance
        ) {
            connectedSegments.push(
                endpoints
            );
        } else if (
            endDistance <=
            tolerance * tolerance
        ) {
            connectedSegments.push({
                start: endpoints.end,
                end: endpoints.start,
            });
        }
    });

    let directionX = 0;
    let directionY = 0;

    connectedSegments.forEach(
        segment => {
            const dx =
                Number(segment.end.x) -
                Number(point.x);

            const dy =
                Number(segment.end.y) -
                Number(point.y);

            const length =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (length > 0) {
                directionX += dx / length;
                directionY += dy / length;
            }
        }
    );

    const directionLength =
        Math.sqrt(
            directionX * directionX +
            directionY * directionY
        );

    if (directionLength > 0) {
        directionX =
            -directionX /
            directionLength;

        directionY =
            -directionY /
            directionLength;
    } else {
        directionX = 0;
        directionY = -1;
    }

    /*
     * Vertex identifiers are deliberately kept farther away from
     * the point than ordinary text. This prevents the identifier
     * from touching the vertex marker itself.
     *
     * The label is still close to the vertex; we are only giving
     * the single-character identifier enough clearance to remain
     * visually separate from the point and connected geometry.
     */
    const labelOffset = 13;
    const pointClearance = 10;

    const candidates = [
        [directionX, directionY],
        [0, -1],
        [1, -1],
        [-1, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [-1, 1],
        [0, 1],
    ];

    let best = null;

    candidates.forEach(
        ([dx, dy], index) => {
            const length =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                ) || 1;

            const unitX = dx / length;
            const unitY = dy / length;

            /*
             * React-PDF Text uses the supplied y coordinate as
             * the text baseline. Add a small baseline correction
             * so labels below a vertex do not sit on the vertex.
             */
            const baselineCorrection =
                unitY > 0 ? 4 :
                unitY < 0 ? -1 : 2;

            const candidate = {
                x:
                    mapped.x +
                    unitX * labelOffset,

                y:
                    mapped.y +
                    unitY * labelOffset +
                    baselineCorrection,
            };

            const distanceFromPoint =
                Math.sqrt(
                    (candidate.x - mapped.x) ** 2 +
                    (candidate.y - mapped.y) ** 2
                );

            if (
                distanceFromPoint <
                pointClearance
            ) {
                return;
            }

            let minimumLineDistance =
                Infinity;

            connectedSegments.forEach(
                segment => {
                    const start =
                        mapPoint(
                            segment.start
                        );

                    const end =
                        mapPoint(
                            segment.end
                        );

                    const distance =
                        Math.sqrt(
                            pointToSegmentDistanceSquared(
                                candidate,
                                start,
                                end
                            )
                        );

                    minimumLineDistance =
                        Math.min(
                            minimumLineDistance,
                            distance
                        );
                }
            );

            /*
             * Keep the identifier clear of the actual point and
             * connected lines. Prefer the closest safe candidate.
             */
            const score =
                minimumLineDistance * 10 +
                distanceFromPoint * 0.5 -
                index * 0.05;

            if (
                !best ||
                score > best.score
            ) {
                best = {
                    x: candidate.x,
                    y: candidate.y,
                    score,
                };
            }
        }
    );

    return {
        x:
            best?.x ??
            mapped.x,
        y:
            best?.y ??
            mapped.y - labelOffset,
    };
}

function resolveSceneLineEndpoints(
    line,
    points = []
) {
    if (!line) {
        return null;
    }

    let start = null;
    let end = null;

    if (
        line.from !== undefined &&
        line.to !== undefined
    ) {
        start = findScenePointFlexible(
            points,
            line.from
        );

        end = findScenePointFlexible(
            points,
            line.to
        );
    }

    if (start && end) {
        return {
            start,
            end,
        };
    }

    if (
        Number.isFinite(
            Number(line?.x1)
        ) &&
        Number.isFinite(
            Number(line?.y1)
        ) &&
        Number.isFinite(
            Number(line?.x2)
        ) &&
        Number.isFinite(
            Number(line?.y2)
        )
    ) {
        return {
            start: {
                x: Number(line.x1),
                y: Number(line.y1),
            },
            end: {
                x: Number(line.x2),
                y: Number(line.y2),
            },
        };
    }

    return null;
}

function distanceSquared(a, b) {
    const dx =
        Number(a?.x || 0) -
        Number(b?.x || 0);

    const dy =
        Number(a?.y || 0) -
        Number(b?.y || 0);

    return dx * dx + dy * dy;
}

function resolveSceneRayEndpoint(
    line,
    vertex,
    points = []
) {
    const endpoints =
        resolveSceneLineEndpoints(
            line,
            points
        );

    if (!endpoints) {
        return null;
    }

    const startDistance =
        distanceSquared(
            endpoints.start,
            vertex
        );

    const endDistance =
        distanceSquared(
            endpoints.end,
            vertex
        );

    return startDistance <= endDistance
        ? endpoints.end
        : endpoints.start;
}

function buildSemanticAngleGeometry({
    angle,
    points = [],
    lines = [],
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    padding,
}) {
    const vertex =
        findScenePointFlexible(
            points,
            angle?.vertex
        );

    const side1 =
        findSceneLineFlexible(
            lines,
            points,
            angle?.side1
        );

    const side2 =
        findSceneLineFlexible(
            lines,
            points,
            angle?.side2
        );

    if (
        !vertex ||
        !side1 ||
        !side2
    ) {
        return null;
    }

    const ray1 =
        resolveAngleRayEndpoint(
            side1,
            vertex,
            points
        );

    const ray2 =
        resolveAngleRayEndpoint(
            side2,
            vertex,
            points
        );

    if (!ray1 || !ray2) {
        return null;
    }

    const mappedVertex =
        mapDiagramPoint(
            vertex,
            minX,
            maxX,
            minY,
            maxY,
            width,
            height,
            padding
        );

    const mappedRay1 =
        mapDiagramPoint(
            ray1,
            minX,
            maxX,
            minY,
            maxY,
            width,
            height,
            padding
        );

    const mappedRay2 =
        mapDiagramPoint(
            ray2,
            minX,
            maxX,
            minY,
            maxY,
            width,
            height,
            padding
        );

    const {
        angle1,
        delta,
    } =
        angleBetweenPoints(
            mappedVertex,
            mappedRay1,
            mappedRay2
        );

    const radiusScene =
        Math.max(
            0.1,
            finite(
                angle?.arcRadius,
                0.55
            )
        );

    const scaleX =
        (width - padding * 2) /
        Math.max(
            maxX - minX,
            0.0001
        );

    const scaleY =
        (height - padding * 2) /
        Math.max(
            maxY - minY,
            0.0001
        );

    /*
     * Keep the arc visually close to the actual vertex.
     * The previous 0.8 default was too large for small
     * angles and made the label look detached.
     */
    const radiusPixels =
        Math.max(
            7,
            Math.min(
                20,
                radiusScene *
                    Math.min(
                        scaleX,
                        scaleY
                    )
            )
        );

    const steps =
        Math.max(
            10,
            Math.ceil(
                Math.abs(delta) *
                    180 /
                    Math.PI /
                    4
            )
        );

    const arcPoints = [];

    for (
        let index = 0;
        index <= steps;
        index += 1
    ) {
        const t =
            index / steps;

        const angleValue =
            angle1 + delta * t;

        arcPoints.push({
            x:
                mappedVertex.x +
                radiusPixels *
                    Math.cos(
                        angleValue
                    ),
            y:
                mappedVertex.y +
                radiusPixels *
                    Math.sin(
                        angleValue
                    ),
        });
    }

    const path =
        arcPoints.length
            ? `M ${arcPoints[0].x} ${arcPoints[0].y} ` +
              arcPoints
                  .slice(1)
                  .map(
                      point =>
                          `L ${point.x} ${point.y}`
                  )
                  .join(" ")
            : "";

    const middleAngle =
        angle1 + delta / 2;

    /*
     * Put the value just outside the arc, not at an
     * arbitrary AI coordinate.
     */
    const labelDistance =
        radiusPixels + 8;

    const labelPoint = {
        x:
            mappedVertex.x +
            labelDistance *
                Math.cos(
                    middleAngle
                ),
        y:
            mappedVertex.y +
            labelDistance *
                Math.sin(
                    middleAngle
                ),
    };

    return {
        path,
        labelPoint,
        vertexPoint: mappedVertex,
        radiusPixels,
        angle1,
        angle2:
            angle1 + delta,
    };
}

function resolveSemanticLabelPosition({
    label,
    points = [],
    lines = [],
    circles = [],
    angleAnchors = {},
    mapPoint,
}) {
    const attachedTo =
        label?.attachedTo;

    if (!attachedTo) {
        if (
            Number.isFinite(Number(label?.x)) &&
            Number.isFinite(Number(label?.y))
        ) {
            return mapPoint(label);
        }

        return null;
    }

    const type =
        String(attachedTo?.type || "")
            .toLowerCase();

    if (type === "point") {
        const point =
            findScenePointFlexible(
                points,
                attachedTo?.id
            );

        if (!point) {
            return null;
        }

        /*
         * For point labels the renderer owns placement.
         * This prevents labels from being put directly on
         * a line or inside the geometry.
         */
        return resolvePointLabelPosition({
            point,
            points,
            lines,
            mapPoint,
        });
    }

    if (type === "line") {
        const line = findSceneLine(
            lines,
            attachedTo?.id
        );

        const endpoints =
            resolveSceneLineEndpoints(
                line,
                points
            );

        if (!endpoints) {
            return null;
        }

        const a = mapPoint(
            endpoints.start
        );
        const b = mapPoint(
            endpoints.end
        );

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length =
            Math.sqrt(dx * dx + dy * dy) ||
            1;

        const normalX = -dy / length;
        const normalY = dx / length;
        const offset = Math.max(
            6,
            finite(
                label?.offset,
                9
            )
        );

        return {
            x:
                (a.x + b.x) / 2 +
                normalX * offset,
            y:
                (a.y + b.y) / 2 +
                normalY * offset,
        };
    }

    if (type === "circle") {
        const circle = findSceneCircle(
            circles,
            attachedTo?.id
        );

        if (!circle) {
            return null;
        }

        const center = mapPoint({
            x: finite(circle.cx),
            y: finite(circle.cy),
        });

        const radiusX =
            Math.abs(
                mapPoint({
                    x:
                        finite(circle.cx) +
                        finite(circle.r, 1),
                    y: finite(circle.cy),
                }).x - center.x
            );

        return {
            x:
                center.x +
                radiusX +
                Math.max(
                    6,
                    finite(
                        label?.offset,
                        8
                    )
                ),
            y: center.y,
        };
    }

    if (type === "angle") {
        const anchor =
            angleAnchors[
                String(attachedTo?.id)
            ];

        return anchor || null;
    }

    return null;
}


/* ======================================================
   FLOWCHART DIAGRAM

   Flowcharts use their own renderer/layout so process,
   pipeline, algorithm and AI architecture diagrams do not
   depend on the mathematical/general scene renderer.
   ====================================================== */

function FlowchartDiagram({
    
    width = 515,
    height = 300,
    showLabels = true,
    background = "transparent",
    nodes = [],
    edges = [],
    steps = [],
    rectangles = [],
    arrows = [],
    labels = [],
}) {
    const safeWidth = safeDimension(width, 515);
    const safeHeight = safeDimension(height, 300);
    const padding = 24;

    const rawNodes =
        Array.isArray(nodes) && nodes.length
            ? nodes
            : Array.isArray(steps) && steps.length
              ? steps
              : [];

    const normalizeNode = (node, index) => ({
        ...node,
        id: String(
            node?.id ??
            node?.key ??
            node?.name ??
            node?.label ??
            index,
        ),
        text: String(
            node?.text ??
            node?.label ??
            node?.title ??
            node?.name ??
            "",
        ).trim(),
        nodeType: String(
            node?.nodeType ??
            node?.shape ??
            node?.type ??
            "process",
        ).toLowerCase(),
        width: safeDimension(
            node?.width,
            108,
        ),
        height: safeDimension(
            node?.height,
            44,
        ),
    });

    let normalizedNodes = rawNodes.map(
        normalizeNode,
    );

    /*
     * Backward-compatible fallback:
     * If the AI still sends a scene-style rectangle/label
     * representation for a flowchart, convert those pieces
     * into flowchart nodes without changing the scene renderer.
     */
    if (
        normalizedNodes.length === 0 &&
        Array.isArray(rectangles) &&
        rectangles.length
    ) {
        normalizedNodes = rectangles.map(
            (rectangle, index) => {
                const centerX =
                    finite(rectangle?.x) +
                    finite(
                        rectangle?.width,
                        1,
                    ) / 2;
                const centerY =
                    finite(rectangle?.y) -
                    finite(
                        rectangle?.height,
                        1,
                    ) / 2;

                const nearestLabel =
                    Array.isArray(labels)
                        ? labels
                              .map(
                                  (label) => ({
                                      ...label,
                                      distance:
                                          Math.abs(
                                              finite(
                                                  label?.x,
                                              ) -
                                              centerX,
                                          ) +
                                          Math.abs(
                                              finite(
                                                  label?.y,
                                              ) -
                                              centerY,
                                          ),
                                  }),
                              )
                              .sort(
                                  (a, b) =>
                                      a.distance -
                                      b.distance,
                              )[0]
                        : null;

                return normalizeNode(
                    {
                        id:
                            rectangle?.id ??
                            rectangle?.name ??
                            index,
                        text:
                            rectangle?.text ??
                            rectangle?.label ??
                            nearestLabel?.text ??
                            "",
                        nodeType:
                            rectangle?.nodeType ??
                            rectangle?.shape ??
                            "process",
                        width:
                            rectangle?.width,
                        height:
                            rectangle?.height,
                        x: centerX,
                        y: centerY,
                    },
                    index,
                );
            },
        );
    }

    const flowchartSteps =
        normalizedNodes
            .map(
                (node) =>
                    String(
                        node?.text ??
                        node?.label ??
                        node?.title ??
                        node?.name ??
                        ""
                    ).trim()
            )
            .filter(Boolean);

    if (flowchartSteps.length > 0) {
        return (
            <NotesFlowchart
                title="Flow Chart"
                steps={flowchartSteps.slice(0, 6)}
            />
        );
    }

    const nodeMap = new Map();

    normalizedNodes.forEach(
        (node, index) => {
            nodeMap.set(
                String(node.id),
                {
                    ...node,
                    index,
                },
            );
        },
    );

    const explicitEdges = (
        Array.isArray(edges)
            ? edges
            : []
    )
        .map((edge, index) => ({
            ...edge,
            id: String(
                edge?.id ??
                edge?.name ??
                index,
            ),
            from: String(
                edge?.from ??
                edge?.source ??
                edge?.start ??
                "",
            ),
            to: String(
                edge?.to ??
                edge?.target ??
                edge?.end ??
                "",
            ),
            text: String(
                edge?.text ??
                edge?.label ??
                "",
            ).trim(),
        }))
        .filter(
            (edge) =>
                nodeMap.has(edge.from) &&
                nodeMap.has(edge.to) &&
                edge.from !== edge.to,
        );

    const findNearestNodeId = (point) => {
        let nearestId = null;
        let nearestDistance = Infinity;

        nodeMap.forEach((node) => {
            const centerX = Number(node?.x);
            const centerY = Number(node?.y);

            if (
                !Number.isFinite(centerX) ||
                !Number.isFinite(centerY)
            ) {
                return;
            }

            const dx =
                finite(point?.x) - centerX;
            const dy =
                finite(point?.y) - centerY;
            const distance =
                dx * dx + dy * dy;

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestId = node.id;
            }
        });

        return nearestId;
    };

    /*
     * Legacy scene-style flowcharts often contain only
     * rectangles + arrow coordinates. Convert those arrows into
     * semantic node-to-node edges so the new flowchart renderer
     * can lay them out cleanly.
     */
    const inferredEdges =
        explicitEdges.length > 0
            ? []
            : Array.isArray(arrows)
              ? arrows
                    .map((arrow, index) => ({
                        ...arrow,
                        id: String(
                            arrow?.id ??
                            arrow?.name ??
                            `inferred-${index}`,
                        ),
                        from: findNearestNodeId({
                            x: arrow?.x1,
                            y: arrow?.y1,
                        }),
                        to: findNearestNodeId({
                            x: arrow?.x2,
                            y: arrow?.y2,
                        }),
                        text: String(
                            arrow?.text ??
                            arrow?.label ??
                            "",
                        ).trim(),
                    }))
                    .filter(
                        (edge) =>
                            edge.from &&
                            edge.to &&
                            edge.from !== edge.to,
                    )
              : [];

    const normalizedEdges = [
        ...explicitEdges,
        ...inferredEdges,
    ];

    /*
     * Build a simple left-to-right rank layout when AI output
     * does not provide explicit positions.
     */
    const incoming = new Map();
    const outgoing = new Map();

    normalizedNodes.forEach((node) => {
        incoming.set(node.id, []);
        outgoing.set(node.id, []);
    });

    normalizedEdges.forEach((edge) => {
        incoming.get(edge.to)?.push(edge.from);
        outgoing.get(edge.from)?.push(edge.to);
    });

    const ranks = new Map();
    const unresolved = new Set(
        normalizedNodes.map((node) => node.id),
    );

    normalizedNodes.forEach((node) => {
        if (!incoming.get(node.id)?.length) {
            ranks.set(node.id, 0);
            unresolved.delete(node.id);
        }
    });

    for (let pass = 0; pass < normalizedNodes.length + 2; pass += 1) {
        let changed = false;

        unresolved.forEach((id) => {
            const parents = incoming.get(id) || [];
            const knownParents = parents.filter((parent) =>
                ranks.has(parent),
            );

            if (knownParents.length === parents.length) {
                const nextRank =
                    knownParents.reduce(
                        (maxRank, parent) =>
                            Math.max(
                                maxRank,
                                ranks.get(parent),
                            ),
                        0,
                    ) + 1;

                ranks.set(id, nextRank);
                unresolved.delete(id);
                changed = true;
            }
        });

        if (!changed) {
            break;
        }
    }

    /* Cycles / disconnected nodes get deterministic fallback ranks. */
    normalizedNodes.forEach((node) => {
        if (!ranks.has(node.id)) {
            ranks.set(node.id, 0);
        }
    });

    const columns = new Map();

    normalizedNodes.forEach((node) => {
        const hasExplicitPosition =
            Number.isFinite(Number(node?.x)) &&
            Number.isFinite(Number(node?.y));

        const rank = hasExplicitPosition
            ? null
            : ranks.get(node.id) || 0;

        if (rank !== null) {
            if (!columns.has(rank)) {
                columns.set(rank, []);
            }

            columns.get(rank).push(node.id);
        }
    });

    const maxRank =
        columns.size > 0
            ? Math.max(...columns.keys())
            : 0;

    const horizontalGap = 32;
    const verticalGap = 28;

    const positionedNodes = new Map();

    const explicitNodes = normalizedNodes.filter(
        (node) =>
            Number.isFinite(Number(node?.x)) &&
            Number.isFinite(Number(node?.y)),
    );

    explicitNodes.forEach((node) => {
        positionedNodes.set(node.id, {
            ...node,
            x: finite(node.x),
            y: finite(node.y),
        });
    });

    const availableWidth =
        safeWidth - padding * 2;
    const columnWidth =
        maxRank > 0
            ? Math.max(
                  110,
                  (availableWidth -
                      maxRank * horizontalGap) /
                      (maxRank + 1),
              )
            : 110;

    columns.forEach((ids, rank) => {
        ids.forEach((id, rowIndex) => {
            const node = nodeMap.get(id);
            if (!node) {
                return;
            }

            const x =
                padding +
                rank *
                    (columnWidth + horizontalGap) +
                columnWidth / 2;

            const totalHeight =
                ids.length * node.height +
                Math.max(
                    0,
                    ids.length - 1,
                ) *
                    verticalGap;

            const startY =
                safeHeight / 2 -
                totalHeight / 2 +
                node.height / 2;

            const y =
                startY +
                rowIndex *
                    (node.height + verticalGap);

            positionedNodes.set(id, {
                ...node,
                x,
                y,
            });
        });
    });

    const remainingIds = normalizedNodes
        .map((node) => node.id)
        .filter((id) => !positionedNodes.has(id));

    remainingIds.forEach((id, index) => {
        const node = nodeMap.get(id);
        if (!node) {
            return;
        }

        positionedNodes.set(id, {
            ...node,
            x:
                padding +
                node.width / 2 +
                index *
                    (node.width + horizontalGap),
            y: safeHeight / 2,
        });
    });

    const clampNodeCenter = (node) => ({
        ...node,
        x: Math.min(
            safeWidth - padding -
                node.width / 2,
            Math.max(
                padding + node.width / 2,
                finite(node.x, safeWidth / 2),
            ),
        ),
        y: Math.min(
            safeHeight - padding -
                node.height / 2,
            Math.max(
                padding + node.height / 2,
                finite(node.y, safeHeight / 2),
            ),
        ),
    });

    positionedNodes.forEach((node, id) => {
        positionedNodes.set(
            id,
            clampNodeCenter(node),
        );
    });

    const getNodeTextLines = (text) =>
        String(text || "")
            .split(/\n+/u)
            .map((line) => line.trim())
            .filter(Boolean);

    const getNodeEdgePoint = (
        node,
        side,
    ) => {
        if (side === "left") {
            return {
                x: node.x - node.width / 2,
                y: node.y,
            };
        }

        if (side === "right") {
            return {
                x: node.x + node.width / 2,
                y: node.y,
            };
        }

        if (side === "top") {
            return {
                x: node.x,
                y: node.y - node.height / 2,
            };
        }

        return {
            x: node.x,
            y: node.y + node.height / 2,
        };
    };

    const getEdgeGeometry = (edge) => {
        const source = positionedNodes.get(edge.from);
        const target = positionedNodes.get(edge.to);

        if (!source || !target) {
            return null;
        }

        const sameRow =
            Math.abs(source.y - target.y) < 10;
        const targetIsRight =
            target.x >= source.x;

        if (sameRow) {
            const from = getNodeEdgePoint(
                source,
                targetIsRight
                    ? "right"
                    : "left",
            );
            const to = getNodeEdgePoint(
                target,
                targetIsRight
                    ? "left"
                    : "right",
            );

            return {
                points: [from, to],
                labelPoint: {
                    x: (from.x + to.x) / 2,
                    y: (from.y + to.y) / 2 - 8,
                },
            };
        }

        const targetIsBelow =
            target.y >= source.y;

        const from = getNodeEdgePoint(
            source,
            targetIsBelow ? "bottom" : "top",
        );
        const to = getNodeEdgePoint(
            target,
            targetIsBelow ? "top" : "bottom",
        );

        const midY =
            (from.y + to.y) / 2;

        return {
            points: [
                from,
                {
                    x: from.x,
                    y: midY,
                },
                {
                    x: to.x,
                    y: midY,
                },
                to,
            ],
            labelPoint: {
                x: (from.x + to.x) / 2 + 6,
                y: midY - 6,
            },
        };
    };

    const renderFlowArrow = (
        x1,
        y1,
        x2,
        y2,
        style = {},
        key = "flow-arrow",
    ) =>
        renderSceneArrow(
            x1,
            y1,
            x2,
            y2,
            style,
            true,
            key,
        );

    const getNodePath = (node) => {
        const left =
            node.x - node.width / 2;
        const right =
            node.x + node.width / 2;
        const top =
            node.y - node.height / 2;
        const bottom =
            node.y + node.height / 2;

        if (
            node.nodeType.includes("decision") ||
            node.nodeType.includes("diamond")
        ) {
            return [
                `M ${node.x} ${top}`,
                `L ${right} ${node.y}`,
                `L ${node.x} ${bottom}`,
                `L ${left} ${node.y}`,
                "Z",
            ].join(" ");
        }

        return [
            `M ${left} ${top}`,
            `L ${right} ${top}`,
            `L ${right} ${bottom}`,
            `L ${left} ${bottom}`,
            "Z",
        ].join(" ");
    };

    const flowElements = [];

    /* Connectors are rendered first so nodes stay visually on top. */
    normalizedEdges.forEach((edge, edgeIndex) => {
        const geometry = getEdgeGeometry(edge);

        if (!geometry) {
            return;
        }

        const style = normalizeSceneStyle(
            edge?.style,
        );

        for (
            let segmentIndex = 0;
            segmentIndex <
            geometry.points.length - 1;
            segmentIndex += 1
        ) {
            const start =
                geometry.points[segmentIndex];
            const end =
                geometry.points[segmentIndex + 1];

            const isLast =
                segmentIndex ===
                geometry.points.length - 2;

            flowElements.push(
                renderFlowArrow(
                    start.x,
                    start.y,
                    end.x,
                    end.y,
                    style,
                    `flow-edge-${edgeIndex}-${segmentIndex}`,
                ),
            );

            if (isLast && edge.endArrow === false) {
                flowElements.pop();
                flowElements.push(
                    <Line
                        key={`flow-edge-line-${edgeIndex}-${segmentIndex}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        opacity={style.opacity}
                    />,
                );
            }
        }

        const edgeLabel = normalizeDiagramLabelText(
            edge.text,
        );

        if (
            showLabels &&
            edgeLabel
        ) {
            flowElements.push(
                <Text
                    key={`flow-edge-label-${edgeIndex}`}
                    x={geometry.labelPoint.x}
                    y={geometry.labelPoint.y}
                    fontSize={
                        Math.max(
                            1,
                            finite(
                                edge?.fontSize,
                                9,
                            ),
                        )
                    }
                    fill={style.stroke}
                >
                    {edgeLabel}
                </Text>,
            );
        }
    });

    positionedNodes.forEach((node, nodeIndex) => {
        const style = normalizeSceneStyle(
            node?.style,
        );

        flowElements.push(
            <Path
                key={`flow-node-${nodeIndex}`}
                d={getNodePath(node)}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                opacity={style.opacity}
            />,
        );

        if (!showLabels) {
            return;
        }

        const linesForText =
            getNodeTextLines(node.text);

        if (!linesForText.length) {
            return;
        }

        const lineHeight = 11;
        const startY =
            node.y -
            ((linesForText.length - 1) *
                lineHeight) /
                2;

        linesForText.forEach(
            (line, lineIndex) => {
                flowElements.push(
                    <Text
                        key={`flow-node-label-${nodeIndex}-${lineIndex}`}
                        x={node.x}
                        y={
                            startY +
                            lineIndex *
                                lineHeight
                        }
                        textAnchor="middle"
                        fontSize={
                            Math.max(
                                1,
                                finite(
                                    node?.fontSize,
                                    9,
                                ),
                            )
                        }
                        fill={style.stroke}
                    >
                        {line}
                    </Text>,
                );
            },
        );
    });

    return (
        <Svg
            width={safeWidth}
            height={safeHeight}
            viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        >
            {background &&
                background !==
                    "transparent" && (
                    <Path
                        d={[
                            `M 0 0`,
                            `L ${safeWidth} 0`,
                            `L ${safeWidth} ${safeHeight}`,
                            `L 0 ${safeHeight}`,
                            "Z",
                        ].join(" ")}
                        fill={background}
                    />
                )}
            {flowElements}
        </Svg>
    );
}

function UniversalVectorScene({
    width = 515,
    height = 300,
    xRange = [-10, 10],
    yRange = [-10, 10],
    showGrid = false,
    showAxes = false,
    showLabels = true,
    background = "transparent",

    lines = [],
    arrows = [],
    circles = [],
    ellipses = [],
    rectangles = [],
    polygons = [],
    paths = [],
    arcs = [],
    curves = [],
    angles = [],
    points = [],
    labels = [],
    dimensions = [],
}) {
    const safeWidth =
        safeDimension(width, 515);

    const safeHeight =
        safeDimension(height, 300);

    const padding = 20;

    let [minX, maxX] =
        safeRange(
            xRange,
            -10,
            10
        );

    let [minY, maxY] =
        safeRange(
            yRange,
            -10,
            10
        );

    const sceneBoundsX = [];
    const sceneBoundsY = [];

    const addSceneBoundsPoint = (x, y) => {
        if (
            Number.isFinite(Number(x)) &&
            Number.isFinite(Number(y))
        ) {
            sceneBoundsX.push(Number(x));
            sceneBoundsY.push(Number(y));
        }
    };

    points.forEach(point => {
        addSceneBoundsPoint(
            point?.x,
            point?.y
        );
    });

    lines.forEach(line => {
        addSceneBoundsPoint(
            line?.x1,
            line?.y1
        );

        addSceneBoundsPoint(
            line?.x2,
            line?.y2
        );
    });

    arrows.forEach(arrow => {
        addSceneBoundsPoint(
            arrow?.x1,
            arrow?.y1
        );

        addSceneBoundsPoint(
            arrow?.x2,
            arrow?.y2
        );
    });

    circles.forEach(circle => {
        const cx = finite(circle?.cx);
        const cy = finite(circle?.cy);
        const radius = Math.abs(
            finite(circle?.r, 0)
        );

        addSceneBoundsPoint(
            cx - radius,
            cy - radius
        );

        addSceneBoundsPoint(
            cx + radius,
            cy + radius
        );
    });

    ellipses.forEach(ellipse => {
        const cx = finite(ellipse?.cx);
        const cy = finite(ellipse?.cy);
        const rx = Math.abs(
            finite(ellipse?.rx, 0)
        );
        const ry = Math.abs(
            finite(ellipse?.ry, 0)
        );

        addSceneBoundsPoint(
            cx - rx,
            cy - ry
        );

        addSceneBoundsPoint(
            cx + rx,
            cy + ry
        );
    });

    rectangles.forEach(rectangle => {
        const x = finite(rectangle?.x);
        const y = finite(rectangle?.y);
        const widthValue = Math.abs(
            finite(rectangle?.width, 0)
        );
        const heightValue = Math.abs(
            finite(rectangle?.height, 0)
        );

        addSceneBoundsPoint(
            x,
            y
        );

        addSceneBoundsPoint(
            x + widthValue,
            y + heightValue
        );
    });

    polygons.forEach(polygon => {
        const polygonPoints =
            Array.isArray(polygon)
                ? polygon
                : Array.isArray(polygon?.points)
                    ? polygon.points
                    : [];

        polygonPoints.forEach(point => {
            addSceneBoundsPoint(
                point?.x,
                point?.y
            );
        });
    });

    arcs.forEach(arc => {
        const cx = finite(arc?.cx);
        const cy = finite(arc?.cy);
        const radius = Math.abs(
            finite(arc?.r, 0)
        );

        addSceneBoundsPoint(
            cx - radius,
            cy - radius
        );

        addSceneBoundsPoint(
            cx + radius,
            cy + radius
        );
    });

    labels.forEach(label => {
        addSceneBoundsPoint(
            label?.x,
            label?.y
        );
    });

    if (sceneBoundsX.length) {
        const geometryMinX =
            Math.min(...sceneBoundsX);
        const geometryMaxX =
            Math.max(...sceneBoundsX);
        const geometryMinY =
            Math.min(...sceneBoundsY);
        const geometryMaxY =
            Math.max(...sceneBoundsY);

        const geometryWidth =
            Math.max(
                geometryMaxX - geometryMinX,
                1
            );

        const geometryHeight =
            Math.max(
                geometryMaxY - geometryMinY,
                1
            );

        const marginX =
            geometryWidth * 0.08;
        const marginY =
            geometryHeight * 0.08;

        minX = Math.min(
            minX,
            geometryMinX - marginX
        );

        maxX = Math.max(
            maxX,
            geometryMaxX + marginX
        );

        minY = Math.min(
            minY,
            geometryMinY - marginY
        );

        maxY = Math.max(
            maxY,
            geometryMaxY + marginY
        );
    }

    const elements = [];

    const mapPoint = point =>
        scenePoint(
            point,
            minX,
            maxX,
            minY,
            maxY,
            safeWidth,
            safeHeight,
            padding
        );

    const addGrid = () => {
        if (!showGrid) {
            return;
        }

        for (
            let x = Math.ceil(minX);
            x <= Math.floor(maxX);
            x += 1
        ) {
            const px = mapX(
                x,
                minX,
                maxX,
                safeWidth,
                padding
            );

            elements.push(
                <Line
                    key={`scene-grid-x-${x}`}
                    x1={px}
                    y1={padding}
                    x2={px}
                    y2={
                        safeHeight -
                        padding
                    }
                    stroke="#E5E7EB"
                    strokeWidth={0.5}
                />
            );
        }

        for (
            let y = Math.ceil(minY);
            y <= Math.floor(maxY);
            y += 1
        ) {
            const py = mapY(
                y,
                minY,
                maxY,
                safeHeight,
                padding
            );

            elements.push(
                <Line
                    key={`scene-grid-y-${y}`}
                    x1={padding}
                    y1={py}
                    x2={
                        safeWidth -
                        padding
                    }
                    y2={py}
                    stroke="#E5E7EB"
                    strokeWidth={0.5}
                />
            );
        }
    };

    addGrid();

    if (showAxes) {
        const axisY =
            minY <= 0 &&
            maxY >= 0
                ? mapY(
                      0,
                      minY,
                      maxY,
                      safeHeight,
                      padding
                  )
                : safeHeight -
                  padding;

        const axisX =
            minX <= 0 &&
            maxX >= 0
                ? mapX(
                      0,
                      minX,
                      maxX,
                      safeWidth,
                      padding
                  )
                : padding;

        elements.push(
            <Line
                key="scene-axis-x"
                x1={padding}
                y1={axisY}
                x2={
                    safeWidth -
                    padding
                }
                y2={axisY}
                stroke="#111827"
                strokeWidth={1}
            />
        );

        elements.push(
            <Line
                key="scene-axis-y"
                x1={axisX}
                y1={
                    safeHeight -
                    padding
                }
                x2={axisX}
                y2={padding}
                stroke="#111827"
                strokeWidth={1}
            />
        );
    }

    lines.forEach(
        (line, index) => {
            const a = mapPoint({
                x: finite(line?.x1),
                y: finite(line?.y1),
            });

            const b = mapPoint({
                x: finite(line?.x2),
                y: finite(line?.y2),
            });

            const style =
                normalizeSceneStyle(
                    line?.style
                );

            elements.push(
                <Line
                    key={`scene-line-${index}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={style.stroke}
                    strokeWidth={
                        style.strokeWidth
                    }
                    opacity={style.opacity}
                />
            );
        }
    );

    arrows.forEach(
        (arrow, index) => {
            const a = mapPoint({
                x: finite(arrow?.x1),
                y: finite(arrow?.y1),
            });

            const b = mapPoint({
                x: finite(arrow?.x2),
                y: finite(arrow?.y2),
            });

            elements.push(
                renderSceneArrow(
                    a.x,
                    a.y,
                    b.x,
                    b.y,
                    arrow?.style,
                    arrow?.endArrow !== false,
                    `scene-arrow-${index}`
                )
            );
        }
    );

    circles.forEach(
        (circle, index) => {
            const center =
                mapPoint({
                    x: finite(
                        circle?.cx
                    ),
                    y: finite(
                        circle?.cy
                    ),
                });

            const radiusX =
                (finite(
                    circle?.r,
                    1
                ) /
                    (maxX - minX)) *
                (safeWidth -
                    padding * 2);

            const radiusY =
                (finite(
                    circle?.r,
                    1
                ) /
                    (maxY - minY)) *
                (safeHeight -
                    padding * 2);

            const style =
                normalizeSceneStyle(
                    circle?.style
                );

            elements.push(
                <Circle
                    key={`scene-circle-${index}`}
                    cx={center.x}
                    cy={center.y}
                    r={Math.max(
                        1,
                        Math.min(
                            radiusX,
                            radiusY
                        )
                    )}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={
                        style.strokeWidth
                    }
                    opacity={style.opacity}
                />
            );
        }
    );

    ellipses.forEach(
        (ellipse, index) => {
            const center =
                mapPoint({
                    x: finite(
                        ellipse?.cx
                    ),
                    y: finite(
                        ellipse?.cy
                    ),
                });

            const rx =
                (finite(
                    ellipse?.rx,
                    1
                ) /
                    (maxX - minX)) *
                (safeWidth -
                    padding * 2);

            const ry =
                (finite(
                    ellipse?.ry,
                    1
                ) /
                    (maxY - minY)) *
                (safeHeight -
                    padding * 2);

            const style =
                normalizeSceneStyle(
                    ellipse?.style
                );

            /*
             * React-PDF SVG does not need a
             * separate ellipse component here.
             * A cubic path gives reliable PDF output.
             */
            const k = 0.5522848;

            const d = [
                `M ${center.x - rx} ${center.y}`,
                `C ${center.x - rx} ${
                    center.y -
                    ry * k
                } ${center.x -
                    rx * k} ${
                    center.y - ry
                } ${center.x} ${
                    center.y - ry
                }`,
                `C ${center.x +
                    rx * k} ${
                    center.y - ry
                } ${center.x + rx} ${
                    center.y -
                    ry * k
                } ${center.x + rx} ${
                    center.y
                }`,
                `C ${center.x + rx} ${
                    center.y +
                    ry * k
                } ${center.x +
                    rx * k} ${
                    center.y + ry
                } ${center.x} ${
                    center.y + ry
                }`,
                `C ${center.x -
                    rx * k} ${
                    center.y + ry
                } ${center.x - rx} ${
                    center.y +
                    ry * k
                } ${center.x - rx} ${
                    center.y
                }`,
                "Z",
            ].join(" ");

            elements.push(
                <Path
                    key={`scene-ellipse-${index}`}
                    d={d}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={
                        style.strokeWidth
                    }
                    opacity={style.opacity}
                />
            );
        }
    );

    rectangles.forEach(
        (rectangle, index) => {
            const topLeft =
                mapPoint({
                    x: finite(
                        rectangle?.x
                    ),
                    y: finite(
                        rectangle?.y
                    ),
                });

            const bottomRight =
                mapPoint({
                    x:
                        finite(
                            rectangle?.x
                        ) +
                        finite(
                            rectangle?.width,
                            1
                        ),
                    y:
                        finite(
                            rectangle?.y
                        ) -
                        finite(
                            rectangle?.height,
                            1
                        ),
                });

            const style =
                normalizeSceneStyle(
                    rectangle?.style
                );

            elements.push(
                <Path
                    key={`scene-rect-${index}`}
                    d={[
                        `M ${topLeft.x} ${topLeft.y}`,
                        `L ${bottomRight.x} ${topLeft.y}`,
                        `L ${bottomRight.x} ${bottomRight.y}`,
                        `L ${topLeft.x} ${bottomRight.y}`,
                        "Z",
                    ].join(" ")}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={
                        style.strokeWidth
                    }
                    opacity={style.opacity}
                />
            );
        }
    );

    polygons.forEach(
        (polygon, index) => {
            if (
                !Array.isArray(
                    polygon?.points
                ) ||
                polygon.points.length <
                    2
            ) {
                return;
            }

            const mapped =
                polygon.points.map(
                    mapPoint
                );

            const d = [
                `M ${mapped[0].x} ${mapped[0].y}`,
                ...mapped
                    .slice(1)
                    .map(
                        point =>
                            `L ${point.x} ${point.y}`
                    ),
                ...(polygon.closed !== false
                    ? ["Z"]
                    : []),
            ].join(" ");

            const style =
                normalizeSceneStyle(
                    polygon?.style
                );

            elements.push(
                <Path
                    key={`scene-polygon-${index}`}
                    d={d}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={
                        style.strokeWidth
                    }
                    opacity={style.opacity}
                />
            );
        }
    );

    paths.forEach(
        (path, index) => {
            if (!path?.d) {
                return;
            }

            const style =
                normalizeSceneStyle(
                    path?.style
                );

            elements.push(
                <Path
                    key={`scene-path-${index}`}
                    d={path.d}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={
                        style.strokeWidth
                    }
                    opacity={style.opacity}
                />
            );
        }
    );

    /*
     * JSON renderer policy:
     * Do not render explicit arc objects.
     *
     * This prevents AI-generated angle arcs/marks from appearing
     * even when the JSON scene still contains an `arcs` array.
     */
    curves.forEach(
        (curve, index) => {
            const d =
                buildSceneCurvePath({
                    equation:
                        curve?.equation,
                    xRange:
                        safeRange(
                            curve?.xRange,
                            minX,
                            maxX
                        ),
                    yRange:
                        safeRange(
                            curve?.yRange,
                            minY,
                            maxY
                        ),
                    width: safeWidth,
                    height: safeHeight,
                    padding,
                });

            const style =
                normalizeSceneStyle(
                    curve?.style
                );

            if (d) {
                elements.push(
                    <Path
                        key={`scene-curve-${index}`}
                        d={d}
                        fill="none"
                        stroke={style.stroke}
                        strokeWidth={
                            style.strokeWidth
                        }
                        opacity={style.opacity}
                    />
                );
            }
        }
    );

    points.forEach(
        (point, index) => {
            const mapped =
                mapPoint(point);

            elements.push(
                <Circle
                    key={`scene-point-${index}`}
                    cx={mapped.x}
                    cy={mapped.y}
                    r={3}
                    fill="#111827"
                />
            );
        }
    );

    const angleAnchors = {};

    /*
     * Angle rendering is intentionally disabled.
     *
     * The AI may still provide angle data in the scene schema, but this
     * renderer must not draw angle arcs/marks or angle-value labels.
     * This prevents incorrect angle placement from affecting diagrams.
     */

    if (showLabels) {
        labels.forEach(
            (label, index) => {
                const normalizedText =
                    normalizeDiagramLabelText(
                        label?.text
                    );

                /*
                 * Empty descriptive labels are deliberately
                 * suppressed. Geometry itself remains untouched.
                 */
                if (
                    shouldSuppressUniversalLabel(
                        label,
                        normalizedText
                    )
                ) {
                    return;
                }

                const attachedTo =
                    label?.attachedTo;

                let mapped =
                    resolveSemanticLabelPosition({
                        label,
                        points,
                        lines,
                        circles,
                        angleAnchors,
                        mapPoint,
                    });

                /*
                 * If a point label is not explicitly attached,
                 * detect the point from its normalized label and
                 * let the renderer place it around that point.
                 */
                if (
                    !mapped &&
                    /^[A-Za-z]$/u.test(
                        normalizedText
                    )
                ) {
                    const point =
                        findScenePointFlexible(
                            points,
                            normalizedText
                        );

                    if (point) {
                        mapped =
                            resolvePointLabelPosition({
                                point,
                                points,
                                lines,
                                mapPoint,
                            });
                    }
                }

                /*
                 * Angle, measurement, and dimension labels have
                 * already been filtered by the renderer policy above.
                 * Only genuine diagram identifiers/labels continue.
                 */

                if (!mapped) {
                    if (
                        Number.isFinite(
                            Number(label?.x)
                        ) &&
                        Number.isFinite(
                            Number(label?.y)
                        )
                    ) {
                        mapped = mapPoint(label);
                    } else {
                        return;
                    }
                }

                const style =
                    normalizeSceneStyle(
                        label?.style
                    );

                elements.push(
                    <Text
                        key={`scene-label-${index}`}
                        x={mapped.x}
                        y={mapped.y}
                        fontSize={Math.max(
                            1,
                            finite(
                                label?.fontSize,
                                10
                            )
                        )}
                        fill={style.stroke}
                        opacity={style.opacity}
                    >
                        {normalizedText}
                    </Text>
                );
            }
        );
    }

    // Maths diagrams do not render automatic dimensions.
// Measurement arrows, dimension lines, and dimension labels
// are intentionally disabled.

    return (
        <Svg
            width={safeWidth}
            height={safeHeight}
            viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        >
            {background &&
                background !==
                    "transparent" && (
                    <Path
                        d={[
                            `M 0 0`,
                            `L ${safeWidth} 0`,
                            `L ${safeWidth} ${safeHeight}`,
                            `L 0 ${safeHeight}`,
                            "Z",
                        ].join(" ")}
                        fill={background}
                    />
                )}

            {elements}
        </Svg>
    );
}


/* ======================================================
   MAIN DIAGRAM COMPONENT
   ====================================================== */

export default function MathDiagram({
    type = "coordinatePlane",
    ...props
}) {
    /*
     * Universal vector scenes are the preferred
     * representation for new diagrams.
     */
    if (type === "flowchart") {
        return (
            <FlowchartDiagram
                {...props}
            />
        );
    }

    if (
        type === "scene" ||
        type === "vector" ||
        type === "custom" ||
        type === "graph" ||
        type === "circuit"
    ) {
        return (
            <UniversalVectorScene
                {...props}
            />
        );
    }

    if (type === "functionGraph") {
        return (
            <FunctionGraph
                {...props}
            />
        );
    }

    if (type === "ascii") {
        return (
            <ASCIIDiagram
                {...props}
            />
        );
    }

    if (
        type === "line" ||
        type === "triangle" ||
        type === "rectangle" ||
        type === "square" ||
        type === "circle" ||
        type === "angle"
    ) {
        return (
            <GeometryDiagram
                type={type}
                {...props}
            />
        );
    }

    return (
        <CoordinatePlane
            {...props}
        />
    );
}

export {
    MathDiagram,
    CoordinatePlane,
    FunctionGraph,
    GeometryDiagram,
    ASCIIDiagram,
};