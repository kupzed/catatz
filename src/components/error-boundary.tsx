"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[error-boundary] CatatZ UI crashed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
          <div className="max-w-sm space-y-4">
            <Image
              src="/catatz.svg"
              alt="CatatZ"
              width={56}
              height={56}
              className="mx-auto h-14 w-14 rounded-full"
            />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                CatatZ perlu dimuat ulang
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Ada bagian tampilan yang tidak berhasil dimuat. Data Anda tetap aman.
              </p>
            </div>
            <Button type="button" onClick={() => window.location.reload()}>
              Muat Ulang
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
