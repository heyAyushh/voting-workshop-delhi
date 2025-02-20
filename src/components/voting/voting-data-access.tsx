"use client";

import { getVotingProgram, getVotingProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import { BN } from "bn.js";
import { SystemProgram } from "@solana/web3.js";

type InitializePollAccounts = {
  signer: PublicKey;
  poll: PublicKey;
  systemProgram: PublicKey;
};

type InitializeCandidateAccounts = {
  signer: PublicKey;
  poll: PublicKey;
  candidate: PublicKey;
  systemProgram: PublicKey;
};

type VoteAccounts = {
  signer: PublicKey;
  poll: PublicKey;
  candidate: PublicKey;
  systemProgram: PublicKey;
};

export function useVotingProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getVotingProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(
    () => getVotingProgram(provider, programId),
    [provider, programId]
  );

  const polls = useQuery({
    queryKey: ["voting", "polls", { cluster }],
    queryFn: () => program.account.poll.all(),
  });

  const candidates = useQuery({
    queryKey: ["voting", "candidates", { cluster }],
    queryFn: () => program.account.candidate.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const initializePoll = useMutation({
    mutationKey: ["voting", "initialize-poll", { cluster }],
    mutationFn: async ({
      pollId,
      description,
      pollStart,
      pollEnd,
    }: {
      pollId: number;
      description: string;
      pollStart: number;
      pollEnd: number;
    }) => {
      const [pollPda] = PublicKey.findProgramAddressSync(
        [new BN(pollId).toArrayLike(Buffer, "le", 8)],
        programId
      );
      return program.methods
        .initializePoll(
          new BN(pollId),
          description,
          new BN(pollStart),
          new BN(pollEnd)
        )
        .accounts({
          signer: provider.publicKey,
          poll: pollPda,
          systemProgram: SystemProgram.programId,
        } as InitializePollAccounts)
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return polls.refetch();
    },
    onError: () => toast.error("Failed to initialize poll"),
  });

  const initializeCandidate = useMutation({
    mutationKey: ["voting", "initialize-candidate", { cluster }],
    mutationFn: async ({
      pollId,
      candidateName,
    }: {
      pollId: number;
      candidateName: string;
    }) => {
      const [pollPda] = PublicKey.findProgramAddressSync(
        [new BN(pollId).toArrayLike(Buffer, "le", 8)],
        programId
      );
      const [candidatePda] = PublicKey.findProgramAddressSync(
        [
          new BN(pollId).toArrayLike(Buffer, "le", 8),
          Buffer.from(candidateName),
        ],
        programId
      );
      return program.methods
        .initializeCandidate(candidateName, new BN(pollId))
        .accounts({
          signer: provider.publicKey,
          poll: pollPda,
          candidate: candidatePda,
          systemProgram: SystemProgram.programId,
        } as InitializeCandidateAccounts)
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return candidates.refetch();
    },
    onError: () => toast.error("Failed to initialize candidate"),
  });

  return {
    program,
    programId,
    polls,
    candidates,
    getProgramAccount,
    initializePoll,
    initializeCandidate,
  };
}

export function useVotingProgramAccount({ pollId }: { pollId: number }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, polls } = useVotingProgram();
  const provider = useAnchorProvider();

  const [pollPda] = PublicKey.findProgramAddressSync(
    [new BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const pollQuery = useQuery({
    queryKey: ["voting", "poll", { cluster, pollId }],
    queryFn: () => program.account.poll.fetch(pollPda),
  });

  const vote = useMutation({
    mutationKey: ["voting", "vote", { cluster, pollId }],
    mutationFn: ({ candidateName }: { candidateName: string }) => {
      const [candidatePda] = PublicKey.findProgramAddressSync(
        [
          new BN(pollId).toArrayLike(Buffer, "le", 8),
          Buffer.from(candidateName),
        ],
        program.programId
      );
      return program.methods
        .vote(candidateName, new BN(pollId))
        .accounts({
          signer: provider.publicKey,
          poll: pollPda,
          candidate: candidatePda,
          systemProgram: SystemProgram.programId,
        } as VoteAccounts)
        .rpc();
    },
    onSuccess: (tx) => {
      transactionToast(tx);
      return pollQuery.refetch();
    },
  });

  return {
    pollQuery,
    vote,
  };
}
